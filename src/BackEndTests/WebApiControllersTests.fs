// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
namespace BackEndTests

open System
open Owin;
open Microsoft.FSharp.Control.WebExtensions 
open Microsoft.VisualStudio.TestTools.UnitTesting
open Newtonsoft.Json.Linq
open BioModelAnalyzer
open System.Web.Http
open System.IO
open FSharp.Data.HttpRequestHeaders
open FSharp.Data
open BMAWebApi
open Unity
open bma.BioCheck

type TestFailureLogger() =
    member val FailureCount = 0 with get,set

    interface IFailureLogger with
        member x.Add(_,_,_,_) =
            x.FailureCount <- x.FailureCount + 1

[<TestClass>]
[<DeploymentItem("Analyze.exe")>]
[<DeploymentItem("FurtherTesting.exe")>]
[<DeploymentItem("Simulate.exe")>]
[<DeploymentItem("libz3.dll")>]
[<DeploymentItem("Microsoft.Owin.Host.HttpListener.dll")>]
type WebApiControllersTests() = 

    static let mutable webApp : IDisposable = null

    static let logger = TestFailureLogger()

    [<ClassInitialize>]
    static member TestClassInit(ctx : TestContext) =
        typeof<bma.client.Controllers.AnalyzeController>.Assembly |> ignore // Force controllers loading
        let configure (app : IAppBuilder) =
            let config = new HttpConfiguration();
            config.Routes.MapHttpRoute("default", "api/{controller}") |> ignore
            app.UseWebApi(config) |> ignore
            let container = new UnityContainer()
            container.RegisterInstance<IFailureLogger>(logger) |> ignore
            config.DependencyResolver <- new UnityResolver(container)

        webApp <- Microsoft.Owin.Hosting.WebApp.Start("http://localhost:8088", Action<IAppBuilder>(configure))

    [<ClassCleanup>]
    static member TestClassCleanup() =
        webApp.Dispose()

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("BrokenModel.json")>]
    member x.``Broken model generates failure log record`` () = 
        async {
            let jobj = JObject.Parse(System.IO.File.ReadAllText("BrokenModel.json", System.Text.Encoding.UTF8))
            let model = jobj.["Model"] :?> JObject
            model.Add("EnableLogging", JValue(true))

            logger.FailureCount <- 0
            let! responseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (model.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(responseString); 
            Assert.AreEqual(StatusType.Error, result.Status)
            Assert.IsTrue(result.ErrorMessages.Length > 0, "errors")
            Assert.IsTrue(logger.FailureCount > 0, "failure log")
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("ToyModelStable.json")>]
    member x.``Correct model doesn't generate failure log record`` () = 
        async {
            let jobj = JObject.Parse(System.IO.File.ReadAllText("ToyModelStable.json", System.Text.Encoding.UTF8))
            let model = jobj.["Model"] :?> JObject
            model.Add("EnableLogging", JValue(true))

            logger.FailureCount <- 0
            let! responseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (model.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(responseString); 
            Assert.AreEqual(StatusType.Stabilizing, result.Status)
            Assert.IsTrue(result.ErrorMessages = null || result.ErrorMessages.Length = 0, "errors")
            Assert.IsTrue(logger.FailureCount = 0, "failure log must be empty")
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("ToyModelStable.json")>]
    member x.``Stable model stabilizes`` () = 
        async {
            let jobj = JObject.Parse(System.IO.File.ReadAllText("ToyModelStable.json", System.Text.Encoding.UTF8))
            let model = jobj.["Model"] :?> JObject
            model.Add("EnableLogging", JValue(false))

            let! responseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (model.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(responseString); 
            Assert.AreEqual(result.Status, StatusType.Stabilizing)
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("ToyModelUnstable.json")>]
    member x.``Unstable model does not stabilize`` () = 
        async {
            let jobj = JObject.Parse(System.IO.File.ReadAllText("ToyModelUnstable.json"))
            let model = jobj.["Model"] :?> JObject
            model.Add("EnableLogging", JValue(false))

            let! responseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (model.ToString()))

            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisResult>(responseString); 
            Assert.AreEqual(result.Status, StatusType.NotStabilizing)
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("ToyModelUnstable.json")>]
    member x.``Unstable model simulated for 10 steps`` () = 
        let jobj = JObject.Parse(System.IO.File.ReadAllText("ToyModelUnstable.json"))
        let model = (jobj.["Model"] :?> JObject).ToObject<Model>()

        let v1 = SimulationVariable()
        v1.Id <- 1
        v1.Value <- 1
        let v2 = SimulationVariable()
        v2.Id <- 2
        v2.Value <- 2
        let v3 = SimulationVariable()
        v3.Id <- 3
        v3.Value <- 3


        let request = new SimulationInput()
        request.Model <- model
        request.Variables <- [| v1; v2; v3 |]
        request.EnableLogging <- false
        async {
            for i in [0..9] do
                let! responseString = 
                     Http.AsyncRequestString("http://localhost:8088/api/Simulate", 
                                             headers = [ ContentType HttpContentTypes.Json;
                                                         Accept HttpContentTypes.Json ],
                                             body = TextRequest (Newtonsoft.Json.JsonConvert.SerializeObject(request)))
                request.Variables <- Newtonsoft.Json.JsonConvert.DeserializeObject<SimulationOutput>(responseString).Variables
                
            let pickId id (v : SimulationVariable) = if v.Id = id then Some(v) else None

            let state = request.Variables
            Assert.AreEqual(state.Length, 3);
            Assert.AreEqual((state |> Array.pick (pickId 1)).Value, 3);
            Assert.AreEqual((state |> Array.pick (pickId 2)).Value, 3);
            Assert.AreEqual((state |> Array.pick (pickId 3)).Value, 2);
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("SimpleBifurcation.json")>]
    member x.``Bifurcating model bifurcates`` () = 
        let jobj = JObject.Parse(System.IO.File.ReadAllText("SimpleBifurcation.json"))
        let jmodel = jobj.["Model"] :?> JObject
        let model = jmodel.ToObject<Model>()

        let analysisInput = jmodel
        analysisInput.Add("EnableLogging", JValue(false))

        async {
            let! analysisResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (analysisInput.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(analysisResponseString); 
            Assert.AreEqual(result.Status, StatusType.NotStabilizing)

            let ftInput = new FurtherTestingInput()
            ftInput.Model <- model
            ftInput.Analysis <- result
            ftInput.EnableLogging <- false
            let! ftResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/FurtherTesting", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (Newtonsoft.Json.JsonConvert.SerializeObject(ftInput)))
   
            let result2 = JObject.Parse(ftResponseString)
            let counterExamples = result2.["CounterExamples"] :?> JArray
                                  |> Seq.filter (fun cex -> cex.["Status"].ToString() = "Bifurcation")
            Assert.AreEqual(Seq.length counterExamples, 1)
            let var = ((Seq.head counterExamples).["Variables"] :?> JArray).[0]
            Assert.AreEqual(var.["Id"].ToString(), "3^0")
            let fix1 = var.["Fix1"].ToString()
            let fix2 = var.["Fix2"].ToString()
            Assert.IsTrue(fix1 = "0" && fix2 = "1" || fix1 = "1" && fix2 = "0", "fixpoints")

        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("Race.json")>]
    member x.``Race model cycles`` () = 
        let jobj = JObject.Parse(System.IO.File.ReadAllText("Race.json"))
        let jmodel = jobj.["Model"] :?> JObject
        let model = jmodel.ToObject<Model>()

        let analysisInput = jmodel
        analysisInput.Add("EnableLogging", JValue(false))

        async {
            let! analysisResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (analysisInput.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(analysisResponseString); 
            Assert.AreEqual(result.Status, StatusType.NotStabilizing)

            let ftInput = new FurtherTestingInput()
            ftInput.Model <- model
            ftInput.Analysis <- result
            ftInput.EnableLogging <- false
            let! ftResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/FurtherTesting", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (Newtonsoft.Json.JsonConvert.SerializeObject(ftInput)))
   
            let result2 = JObject.Parse(ftResponseString)
            let counterExamples = result2.["CounterExamples"] :?> JArray
                                  |> Seq.filter (fun cex -> cex.["Status"].ToString() = "Cycle")
            Assert.AreEqual(Seq.length counterExamples, 1)
            
            let variables = (Seq.head counterExamples).["Variables"] :?> JArray
            Assert.AreEqual(variables.Count, 12)
            let var4_1 = variables |> Seq.pick (fun v -> if v.["Id"].ToString() = "4^1" then Some(v) else None)
            Assert.AreEqual(var4_1.["Value"].ToString(), "1")
        } |> Async.RunSynchronously

    [<TestMethod; TestCategory("CI")>]
    [<DeploymentItem("ion channel.json")>]
    [<DeploymentItem("Microsoft.Owin.Host.HttpListener.dll")>]
    member x.``Ion channel has fixpoint`` () = 
        let jobj = JObject.Parse(System.IO.File.ReadAllText("ion channel.json"))
        let jmodel = jobj.["Model"] :?> JObject
        let model = jmodel.ToObject<Model>()

        let analysisInput = jmodel
        analysisInput.Add("EnableLogging", JValue(false))

        async {
            let! analysisResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/Analyze", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (analysisInput.ToString()))
            let result = Newtonsoft.Json.JsonConvert.DeserializeObject<AnalysisOutput>(analysisResponseString); 
            Assert.AreEqual(result.Status, StatusType.NotStabilizing)

            let ftInput = new FurtherTestingInput()
            ftInput.Model <- model
            ftInput.Analysis <- result
            ftInput.EnableLogging <- false
            let! ftResponseString = 
                 Http.AsyncRequestString("http://localhost:8088/api/FurtherTesting", 
                                         headers = [ ContentType HttpContentTypes.Json;
                                                     Accept HttpContentTypes.Json ],
                                         body = TextRequest (Newtonsoft.Json.JsonConvert.SerializeObject(ftInput)))
   
            let result2 = JObject.Parse(ftResponseString)
            let counterExamples = result2.["CounterExamples"] :?> JArray
                                  |> Seq.filter (fun cex -> cex.["Status"].ToString() = "Fixpoint")
            Assert.AreEqual(Seq.length counterExamples, 1)
            
            let variables = (Seq.head counterExamples).["Variables"] :?> JArray
            Assert.AreEqual(variables.Count, 2)
            let var3_0 = variables |> Seq.pick (fun v -> if v.["Id"].ToString() = "3^0" then Some(v) else None)
            Assert.AreEqual(var3_0.["Value"].ToString(), "0")
            let var2_0 = variables |> Seq.pick (fun v -> if v.["Id"].ToString() = "2^0" then Some(v) else None)
            Assert.AreEqual(var2_0.["Value"].ToString(), "0")
        } |> Async.RunSynchronously
