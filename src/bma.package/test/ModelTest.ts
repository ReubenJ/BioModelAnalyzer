// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
describe("BMA.Model.AppModel",() => {

    window.Commands = new BMA.CommandRegistry();
    var appModel: BMA.Model.AppModel;

    var name = "TestBioModel";
    var v1 = new BMA.Model.Variable(34, 15, BMA.Model.VariableTypes.Default, "name1", 3, 7, "formula1");
    var v2 = new BMA.Model.Variable(38, 10, BMA.Model.VariableTypes.Constant, "name2", 1, 14, "formula2");
    var r1 = new BMA.Model.Relationship(3, 34, 38, BMA.Model.RelationshipTypes.Activator);
    var r2 = new BMA.Model.Relationship(3, 38, 34, BMA.Model.RelationshipTypes.Activator);
    var r3 = new BMA.Model.Relationship(3, 34, 34, BMA.Model.RelationshipTypes.Inhibitor);
    var variables = [v1, v2];
    var relationships = [r1, r2, r3];
    var biomodel = new BMA.Model.BioModel(name, variables, relationships);

    var VL1 = new BMA.Model.VariableLayout(34, 97, 0, 54, 32, 16, "", undefined, undefined);
    var VL2 = new BMA.Model.VariableLayout(38, 22, 41, 0, 3, 7, "", undefined, undefined);
    //var VL3 = new BMA.Model.VariableLayout(9, 14, 75, 6, 4, 0);
    var CL1 = new BMA.Model.ContainerLayout(7, "", 5, 1, 6);
    var CL2 = new BMA.Model.ContainerLayout(3, "", 24, 81, 56);
    var containers = [CL1, CL2];
    var layoutVariables = [VL1, VL2];//, VL3];
    var layout = new BMA.Model.Layout(containers, layoutVariables, [], "");

    var isStable = true;
    var time = 15;
    var ticks = ["one", 4, { ten: 10 }];
    var proof = new BMA.Model.ProofResult(isStable, time, ticks);

    beforeEach(function () {
        appModel = new BMA.Model.AppModel();
    });

    afterEach(function () {
        appModel = undefined;
    });

    it("sets BioModel property", () => {
        appModel.BioModel = biomodel;
        expect(appModel.BioModel).toEqual(biomodel);
    });

    it("executes 'AppModelChanged' command when BioModel property changed", () => {
        spyOn(window.Commands, 'Execute');
        appModel.BioModel = biomodel;
        expect(window.Commands.Execute).toHaveBeenCalledWith("AppModelChanged", { isMajorChange: true });
    });

    it("sets Layout property", () => {
        appModel.Layout = layout;
        expect(appModel.Layout).toEqual(layout);
    });

    it("sets ProofResult property", () => {
        appModel.ProofResult = proof;
        expect(appModel.ProofResult).toEqual(proof);
    });

    it("should reset model to correct serializedModel", () => {
        var ml = { "Model": { "Name": "model 1", "Variables": [{ "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }, { "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "1" }, { "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }], "Relationships": [{ "Id": 4, "FromVariable": 1, "ToVariable": 2, "Type": "Activator" }, { "Id": 5, "FromVariable": 2, "ToVariable": 3, "Type": "Activator" }, { "Id": 6, "FromVariable": 3, "ToVariable": 1, "Type": "Activator" }] }, "Layout": { "Variables": [{ "Id": 1, "Name": "", "Type": "Constant", "ContainerId": 0, "PositionX": -356.212986463621, "PositionY": -93.81451737860536, "CellX": 0, "CellY": 0, "Angle": 0 }, { "Id": 2, "Name": "sdccc", "Type": "Constant", "ContainerId": 0, "PositionX": -169.28934010152284, "PositionY": -106.15853176100808, "CellX": 0, "CellY": 0, "Angle": 0 }, { "Id": 3, "Name": "", "Type": "Constant", "ContainerId": 0, "PositionX": -137.54758883248732, "PositionY": 71.94796147080243, "CellX": 0, "CellY": 0, "Angle": 0 }], "Containers": [] } };

        var variables = [];
        for (var i = 0; i < ml.Model.Variables.length; i++) {
            variables.push(new BMA.Model.Variable(
                ml.Model.Variables[i].Id,
                ml.Layout.Variables[i].ContainerId,
                ml.Layout.Variables[i].Type,
                ml.Layout.Variables[i].Name,
                ml.Model.Variables[i].RangeFrom,
                ml.Model.Variables[i].RangeTo,
                ml.Model.Variables[i].Formula));
        }

        var variableLayouts = [];
        for (var i = 0; i < ml.Layout.Variables.length; i++) {
            variableLayouts.push(new BMA.Model.VariableLayout(
                ml.Layout.Variables[i].Id,
                ml.Layout.Variables[i].PositionX,
                ml.Layout.Variables[i].PositionY,
                ml.Layout.Variables[i].CellX,
                ml.Layout.Variables[i].CellY,
                ml.Layout.Variables[i].Angle,
                "", undefined, undefined));
        }

        var relationships = [];
        for (var i = 0; i < ml.Model.Relationships.length; i++) {
            relationships.push(new BMA.Model.Relationship(
                ml.Model.Relationships[i].Id,
                ml.Model.Relationships[i].FromVariable,
                ml.Model.Relationships[i].ToVariable,
                ml.Model.Relationships[i].Type));
        }

        var containers = [];
        for (var i = 0; i < ml.Layout.Containers.length; i++) {
            containers.push(new BMA.Model.ContainerLayout(
                ml.Layout.Containers[i].id,
                ml.Layout.Containers[i].name,
                ml.Layout.Containers[i].size,
                ml.Layout.Containers[i].positionX,
                ml.Layout.Containers[i].positionY));
        }

        this.model = new BMA.Model.BioModel(ml.Model.Name, variables, relationships);
        this.layout = new BMA.Model.Layout(containers, variableLayouts, [], "");
        
        var serializedModel = JSON.stringify(ml);
        appModel.Deserialize(serializedModel);
        expect(appModel.BioModel).toEqual(this.model);
        expect(appModel.Layout).toEqual(this.layout);
        expect(appModel.ProofResult).toEqual(undefined);
    });

    it("shouldn't reset model when serializedModel isn't correct", () => {
        var ml = {
            "Model": {
                "Variables": [
                    { "Id": 1, "RangeFrom": 0, "RangeTo": 1, "Formula": "" },
                    { "Id": 2, "RangeFrom": 0, "RangeTo": 1, "Formula": "1" },
                    { "Id": 3, "RangeFrom": 0, "RangeTo": 1, "Formula": "" }],
                //"Relationships": [
                //    { "Id": 4, "FromVariable": 1, "ToVariable": 2, "Type": "Activator" },
                //    { "Id": 5, "FromVariable": 2, "ToVariable": 3, "Type": "Activator" },
                //    { "Id": 6, "FromVariable": 3, "ToVariable": 1, "Type": "Activator" }
                //]
            }, "Layout": {
                "Variables": [
                    { "Id": 1, "Name": "", "Type": "Constant", "ContainerId": 0, "PositionX": -356.212986463621, "PositionY": -93.81451737860536, "CellX": 0, "CellY": 0, "Angle": 0 },
                    { "Id": 2, "Name": "sdccc", "Type": "Constant", "ContainerId": 0, "PositionX": -169.28934010152284, "PositionY": -106.15853176100808, "CellX": 0, "CellY": 0, "Angle": 0 },
                    { "Id": 3, "Name": "", "Type": "Constant", "ContainerId": 0, "PositionX": -137.54758883248732, "PositionY": 71.94796147080243, "CellX": 0, "CellY": 0, "Angle": 0 }],
                "Containers": []
            }
        };

        
        var serialized = JSON.stringify(ml);

        appModel.BioModel = biomodel;
        appModel.Layout = layout;
        appModel.ProofResult = proof;

        var newAppModel = new BMA.Model.AppModel();
        newAppModel.BioModel = biomodel;
        newAppModel.Layout = layout;
        newAppModel.ProofResult = proof;
        try {
            appModel.Deserialize(serialized);
        }
        catch (ex) { }

        expect(appModel).toEqual(newAppModel);
    });

    it("should turn model as new when serializedModel is undefined", () => {
        appModel.BioModel = biomodel;
        appModel.Layout = layout;
        appModel.ProofResult = proof;

        var newAppModel = new BMA.Model.AppModel();
        appModel.Deserialize(undefined);

        expect(appModel).toEqual(newAppModel);
    });

    it("should turn model as new when serializedModel is null", () => {
        appModel.BioModel = biomodel;
        appModel.Layout = layout;
        appModel.ProofResult = proof;

        var newAppModel = new BMA.Model.AppModel();
        appModel.Deserialize(null);

        expect(appModel).toEqual(newAppModel);
    });

    /*
    //TODO: Check this test
    it("should serialize model", () => {
        appModel.BioModel = biomodel;
        appModel.Layout = layout;
        appModel.ProofResult = proof;

        var str = '{"Model":{"Name":"TestBioModel","Variables":[{"Id":34,"RangeFrom":3,"RangeTo":7,"Formula":"formula1"},{"Id":38,"RangeFrom":1,"RangeTo":14,"Formula":"formula2"}],"Relationships":[{"Id":3,"FromVariable":34,"ToVariable":38,"Type":"Activator"},{"Id":3,"FromVariable":38,"ToVariable":34,"Type":"Activator"},{"Id":3,"FromVariable":34,"ToVariable":34,"Type":"Inhibitor"}]},"Layout":{"Variables":[{"Id":34,"Name":"name1","Type":"Default","ContainerId":15,"PositionX":97,"PositionY":0,"CellX":54,"CellY":32,"Angle":16},{"Id":38,"Name":"name2","Type":"Constant","ContainerId":10,"PositionX":22,"PositionY":41,"CellX":0,"CellY":3,"Angle":7}],"Containers":[{"Id":7,"Name":"","Size":5,"PositionX":1,"PositionY":6},{"Id":3,"Name":"","Size":24,"PositionX":81,"PositionY":56}]}}';
        expect(appModel.Serialize()).toEqual(str);
    });
    */

    describe("Update states from", () => {
        //var fileLoaderDriver = new BMA.UIDrivers.ModelFileLoader($("#fileLoader"));
        //var fileReader = new FileReader();
        window.OperatorsRegistry = new BMA.LTLOperations.OperatorsRegistry();

        describe("model with 2 equal cells", () => {
            var str = '{"Model":{"Name":"Firing neuron","Variables":[{"Name":"Potential","Id":6,"RangeFrom":0,"RangeTo":1,"Formula":"1"},{"Name":"P2","Id":24,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P3","Id":25,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P4","Id":26,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Output","Id":27,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":1,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(3),var(1))-var(5)"},{"Name":"VS","Id":3,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":4,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":5,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":28,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(29),var(28))-var(31)"},{"Name":"VS","Id":29,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":30,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":31,"RangeFrom":0,"RangeTo":1,"Formula":""}],"Relationships":[{"Id":4,"FromVariable":4,"ToVariable":5,"Type":"Activator"},{"Id":21,"FromVariable":30,"ToVariable":31,"Type":"Activator"},{"Id":2,"FromVariable":3,"ToVariable":1,"Type":"Activator"},{"Id":3,"FromVariable":1,"ToVariable":4,"Type":"Activator"},{"Id":5,"FromVariable":5,"ToVariable":1,"Type":"Inhibitor"},{"Id":10,"FromVariable":1,"ToVariable":24,"Type":"Activator"},{"Id":18,"FromVariable":1,"ToVariable":1,"Type":"Activator"},{"Id":1,"FromVariable":6,"ToVariable":3,"Type":"Activator"},{"Id":19,"FromVariable":29,"ToVariable":28,"Type":"Activator"},{"Id":20,"FromVariable":28,"ToVariable":30,"Type":"Activator"},{"Id":22,"FromVariable":31,"ToVariable":28,"Type":"Inhibitor"},{"Id":23,"FromVariable":28,"ToVariable":28,"Type":"Activator"},{"Id":25,"FromVariable":28,"ToVariable":25,"Type":"Activator"},{"Id":24,"FromVariable":24,"ToVariable":29,"Type":"Activator"}]},"Layout":{"Variables":[{"Id":6,"Name":"Potential","Type":"Constant","ContainerId":0,"PositionX":454.16666666666663,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":24,"Name":"P2","Type":"Constant","ContainerId":0,"PositionX":704.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":25,"Name":"P3","Type":"Constant","ContainerId":0,"PositionX":954.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":26,"Name":"P4","Type":"Constant","ContainerId":0,"PositionX":1204.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":27,"Name":"Output","Type":"Constant","ContainerId":0,"PositionX":1454.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":1,"Name":"Pore","Type":"MembraneReceptor","ContainerId":1,"PositionX":378.7883124043404,"PositionY":293.0092058578739,"CellX":null,"CellY":null,"Angle":0},{"Id":3,"Name":"VS","Type":"MembraneReceptor","ContainerId":1,"PositionX":451.29012214872057,"PositionY":328.0311128390987,"CellX":null,"CellY":null,"Angle":45},{"Id":4,"Name":"CTD_connect","Type":"Default","ContainerId":1,"PositionX":399.06666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":5,"Name":"CTD","Type":"Default","ContainerId":1,"PositionX":351.56666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":28,"Name":"Pore","Type":"MembraneReceptor","ContainerId":2,"PositionX":628.7883124043486,"PositionY":293.00920585707354,"CellX":null,"CellY":null,"Angle":0},{"Id":29,"Name":"VS","Type":"MembraneReceptor","ContainerId":2,"PositionX":701.29012214872,"PositionY":328.03111283909914,"CellX":null,"CellY":null,"Angle":45},{"Id":30,"Name":"CTD_connect","Type":"Default","ContainerId":2,"PositionX":649.0666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":31,"Name":"CTD","Type":"Default","ContainerId":2,"PositionX":601.5666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0}],"Containers":[{"Id":1,"Name":"c1","Size":1,"PositionX":1,"PositionY":1},{"Id":2,"Name":"c2","Size":1,"PositionX":2,"PositionY":1}]},"ltl":{"states":[{"_type":"Keyframe","description":"Low out","name":"N","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output","id":27},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}}]},{"_type":"Keyframe","description":"High out","name":"O","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output","id":27},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}}]},{"_type":"Keyframe","description":"","name":"P","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore","id":1},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS","id":3},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect","id":4},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD","id":5},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Potential","id":6},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P2","id":24},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P3","id":25},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P4","id":26},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output","id":27},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore","id":28},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS","id":29},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect","id":30},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD","id":31},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}}]}],"operations":[{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"SelfLoopKeyframe"}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[null]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]},null]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"O"}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"N"}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"N"}]}]}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"O"}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]}]},"ltllayout":{"operationAppearances":[{"x":63.521009983588584,"y":475.7185619529539,"steps":10},{"x":-23.146608315098522,"y":550.9999999999999,"steps":10},{"x":-15.187508828148665,"y":291.28656293691836,"steps":10},{"x":-30.297190468427758,"y":356.1340706682899,"steps":10},{"x":-212.2578910543725,"y":39.747236759948976,"steps":10},{"x":-246.35164105437252,"y":179.74723675994898,"steps":10},{"x":-645.7578910543725,"y":402.747236759949,"steps":10},{"x":-645.2982604137453,"y":548.2511115882769,"steps":10},{"x":-364.18649021989563,"y":675.8910504871059,"steps":10},{"x":-253.13687327931143,"y":865.2712278448696,"steps":10},{"x":709.6846708806954,"y":719.0786811730429,"steps":10},{"x":697.9601441882176,"y":979.7956669128891,"steps":10},{"x":167.64658852522527,"y":1145.5756351731536,"steps":10},{"x":1150.4741180462097,"y":560.2553439370938,"steps":10},{"x":1914.4903237406295,"y":751.7152522853372,"steps":10},{"x":744.1097830858639,"y":-175.04651124010087,"steps":10},{"x":714.8431664225552,"y":-326.6047947197386,"steps":10},{"x":765.8183485578902,"y":58.11356101863927,"steps":10}]}}';
            var parsed = JSON.parse(str);
            var importedModel = BMA.Model.ImportModelAndLayout(parsed);
            var importedStates = BMA.Model.ImportLTLContents(parsed.ltl);

            it(" One of two variables with same name was removed, last state should be removed", () => {

                var variables = [];

                for (var i = 0; i < importedModel.Model.Variables.length; i++) {
                    var variable = importedModel.Model.Variables[i];
                    if (variable.Id != 1)
                        variables.push(variable);
                }

                var newModel = new BMA.Model.BioModel(importedModel.Model.Name, variables, importedModel.Model.Relationships);
                var newStates = importedStates.states.slice(0, 2);

                expect(BMA.ModelHelper.UpdateStatesWithModel(newModel, importedModel.Layout, importedStates.states)).toEqual({
                    states: newStates,
                    isChanged: true,
                    shouldNotify: false
                });

            });

            it(" One of variables name was removed, state should not be removed", () => {

                var variables = [];

                for (var i = 0; i < importedModel.Model.Variables.length; i++) {
                    var variable = importedModel.Model.Variables[i];
                    if (variable.Id == 1)
                        variables.push(new BMA.Model.Variable(variable.Id, variable.ContainerId, variable.Type, '', variable.RangeFrom, variable.RangeTo, variable.Formula));
                    else
                        variables.push(variable);
                }

                var newStates = importedStates.states.slice(0, 2);
                var kfmChanged = importedStates.states[2];
                var newOperands = [];
                for (var i = 0; i < kfmChanged.Operands.length; i++) {
                    var op = kfmChanged.Operands[i];
                    var newOp;
                    if (op instanceof BMA.LTLOperations.KeyframeEquation) {
                        var leftOperand = op.LeftOperand;
                        if (leftOperand instanceof BMA.LTLOperations.NameOperand) {
                            if (leftOperand.Id == 1) {
                                newOp = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand("", leftOperand.Id), op.Operator, op.RightOperand);
                            } else newOp = op;
                        }
                    }
                    newOperands.push(newOp);
                }
                newStates.push(new BMA.LTLOperations.Keyframe(kfmChanged.Name, kfmChanged.Description, newOperands));

                var newModel = new BMA.Model.BioModel(importedModel.Model.Name, variables, importedModel.Model.Relationships);

                expect(BMA.ModelHelper.UpdateStatesWithModel(newModel, importedModel.Layout, importedStates.states)).toEqual({
                    states: newStates,
                    isChanged: true,
                    shouldNotify: false
                });

            });
        });

        describe("model with 3 equal cells", () => {
            var str = '{"Model":{"Name":"Firing neuron","Variables":[{"Name":"Potential","Id":6,"RangeFrom":0,"RangeTo":1,"Formula":"1"},{"Name":"P2","Id":24,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P3","Id":25,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P4","Id":26,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Output","Id":27,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":1,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(3),var(1))-var(5)"},{"Name":"VS","Id":3,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":4,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":5,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":28,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(29),var(28))-var(31)"},{"Name":"VS","Id":29,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":30,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":31,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":32,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(33),var(32))-var(35)"},{"Name":"VS","Id":33,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":34,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":35,"RangeFrom":0,"RangeTo":1,"Formula":""}],"Relationships":[{"Id":4,"FromVariable":4,"ToVariable":5,"Type":"Activator"},{"Id":21,"FromVariable":30,"ToVariable":31,"Type":"Activator"},{"Id":21,"FromVariable":34,"ToVariable":35,"Type":"Activator"},{"Id":2,"FromVariable":3,"ToVariable":1,"Type":"Activator"},{"Id":3,"FromVariable":1,"ToVariable":4,"Type":"Activator"},{"Id":5,"FromVariable":5,"ToVariable":1,"Type":"Inhibitor"},{"Id":10,"FromVariable":1,"ToVariable":24,"Type":"Activator"},{"Id":18,"FromVariable":1,"ToVariable":1,"Type":"Activator"},{"Id":1,"FromVariable":6,"ToVariable":3,"Type":"Activator"},{"Id":19,"FromVariable":29,"ToVariable":28,"Type":"Activator"},{"Id":20,"FromVariable":28,"ToVariable":30,"Type":"Activator"},{"Id":22,"FromVariable":31,"ToVariable":28,"Type":"Inhibitor"},{"Id":23,"FromVariable":28,"ToVariable":28,"Type":"Activator"},{"Id":25,"FromVariable":28,"ToVariable":25,"Type":"Activator"},{"Id":24,"FromVariable":24,"ToVariable":29,"Type":"Activator"},{"Id":19,"FromVariable":33,"ToVariable":32,"Type":"Activator"},{"Id":20,"FromVariable":32,"ToVariable":34,"Type":"Activator"},{"Id":22,"FromVariable":35,"ToVariable":32,"Type":"Inhibitor"},{"Id":23,"FromVariable":32,"ToVariable":32,"Type":"Activator"},{"Id":27,"FromVariable":32,"ToVariable":26,"Type":"Activator"},{"Id":26,"FromVariable":25,"ToVariable":33,"Type":"Activator"}]},"Layout":{"Variables":[{"Id":6,"Name":"Potential","Type":"Constant","ContainerId":0,"PositionX":454.16666666666663,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":24,"Name":"P2","Type":"Constant","ContainerId":0,"PositionX":704.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":25,"Name":"P3","Type":"Constant","ContainerId":0,"PositionX":954.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":26,"Name":"P4","Type":"Constant","ContainerId":0,"PositionX":1204.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":27,"Name":"Output","Type":"Constant","ContainerId":0,"PositionX":1454.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":1,"Name":"Pore","Type":"MembraneReceptor","ContainerId":1,"PositionX":378.7883124043404,"PositionY":293.0092058578739,"CellX":null,"CellY":null,"Angle":0},{"Id":3,"Name":"VS","Type":"MembraneReceptor","ContainerId":1,"PositionX":451.29012214872057,"PositionY":328.0311128390987,"CellX":null,"CellY":null,"Angle":45},{"Id":4,"Name":"CTD_connect","Type":"Default","ContainerId":1,"PositionX":399.06666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":5,"Name":"CTD","Type":"Default","ContainerId":1,"PositionX":351.56666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":28,"Name":"Pore","Type":"MembraneReceptor","ContainerId":2,"PositionX":628.7883124043486,"PositionY":293.00920585707354,"CellX":null,"CellY":null,"Angle":0},{"Id":29,"Name":"VS","Type":"MembraneReceptor","ContainerId":2,"PositionX":701.29012214872,"PositionY":328.03111283909914,"CellX":null,"CellY":null,"Angle":45},{"Id":30,"Name":"CTD_connect","Type":"Default","ContainerId":2,"PositionX":649.0666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":31,"Name":"CTD","Type":"Default","ContainerId":2,"PositionX":601.5666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":32,"Name":"Pore","Type":"MembraneReceptor","ContainerId":3,"PositionX":878.7883124042828,"PositionY":293.00920586354914,"CellX":null,"CellY":null,"Angle":0},{"Id":33,"Name":"VS","Type":"MembraneReceptor","ContainerId":3,"PositionX":951.2901221487209,"PositionY":328.03111283909834,"CellX":null,"CellY":null,"Angle":45},{"Id":34,"Name":"CTD_connect","Type":"Default","ContainerId":3,"PositionX":899.0666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":35,"Name":"CTD","Type":"Default","ContainerId":3,"PositionX":851.5666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0}],"Containers":[{"Id":1,"Name":"c1","Size":1,"PositionX":1,"PositionY":1},{"Id":2,"Name":"c2","Size":1,"PositionX":2,"PositionY":1},{"Id":3,"Name":"c3","Size":1,"PositionX":3,"PositionY":1}]},"ltl":{"states":[{"_type":"Keyframe","description":"","name":"A","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore","id":1},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS","id":3},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect","id":4},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD","id":5},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Potential","id":6},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P2","id":24},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P3","id":25},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P4","id":26},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output","id":27},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore","id":28},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS","id":29},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect","id":30},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD","id":31},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore","id":32},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS","id":33},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect","id":34},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD","id":35},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}}]}],"operations":[{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"SelfLoopKeyframe"}]},{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[null]}]}]},"ltllayout":{"operationAppearances":[{"x":63.521009983588584,"y":475.7185619529539,"steps":10},{"x":-23.146608315098522,"y":550.9999999999999,"steps":10},{"x":214.30909805798683,"y":380.87004239606114,"steps":10}]}}';
            var parsed = JSON.parse(str);
            var importedModel = BMA.Model.ImportModelAndLayout(parsed);
            var importedStates = BMA.Model.ImportLTLContents(parsed.ltl);

            it(" One of three variables with same name was removed, state should be removed", () => {

                var variables = [];

                for (var i = 0; i < importedModel.Model.Variables.length; i++) {
                    var variable = importedModel.Model.Variables[i];
                    if (variable.Id != 1)
                        variables.push(variable);
                }

                var newModel = new BMA.Model.BioModel(importedModel.Model.Name, variables, importedModel.Model.Relationships);
                var newStates = [];

                expect(BMA.ModelHelper.UpdateStatesWithModel(newModel, importedModel.Layout, importedStates.states)).toEqual({
                    states: newStates,
                    isChanged: true,
                    shouldNotify: false
                });

            });

        });

        describe("model without ids", () => {
            var str = '{"Model":{"Name":"Firing neuron","Variables":[{"Name":"Potential","Id":6,"RangeFrom":0,"RangeTo":1,"Formula":"1"},{"Name":"P2","Id":24,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P3","Id":25,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"P4","Id":26,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Output","Id":27,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":1,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(3),var(1))-var(5)"},{"Name":"VS","Id":3,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":4,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":5,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"Pore","Id":28,"RangeFrom":0,"RangeTo":1,"Formula":"max(var(29),var(28))-var(31)"},{"Name":"VS","Id":29,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD_connect","Id":30,"RangeFrom":0,"RangeTo":1,"Formula":""},{"Name":"CTD","Id":31,"RangeFrom":0,"RangeTo":1,"Formula":""}],"Relationships":[{"Id":4,"FromVariable":4,"ToVariable":5,"Type":"Activator"},{"Id":21,"FromVariable":30,"ToVariable":31,"Type":"Activator"},{"Id":2,"FromVariable":3,"ToVariable":1,"Type":"Activator"},{"Id":3,"FromVariable":1,"ToVariable":4,"Type":"Activator"},{"Id":5,"FromVariable":5,"ToVariable":1,"Type":"Inhibitor"},{"Id":10,"FromVariable":1,"ToVariable":24,"Type":"Activator"},{"Id":18,"FromVariable":1,"ToVariable":1,"Type":"Activator"},{"Id":1,"FromVariable":6,"ToVariable":3,"Type":"Activator"},{"Id":19,"FromVariable":29,"ToVariable":28,"Type":"Activator"},{"Id":20,"FromVariable":28,"ToVariable":30,"Type":"Activator"},{"Id":22,"FromVariable":31,"ToVariable":28,"Type":"Inhibitor"},{"Id":23,"FromVariable":28,"ToVariable":28,"Type":"Activator"},{"Id":25,"FromVariable":28,"ToVariable":25,"Type":"Activator"},{"Id":24,"FromVariable":24,"ToVariable":29,"Type":"Activator"}]},"Layout":{"Variables":[{"Id":6,"Name":"Potential","Type":"Constant","ContainerId":0,"PositionX":454.16666666666663,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":24,"Name":"P2","Type":"Constant","ContainerId":0,"PositionX":704.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":25,"Name":"P3","Type":"Constant","ContainerId":0,"PositionX":954.1666666666666,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":26,"Name":"P4","Type":"Constant","ContainerId":0,"PositionX":1204.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":27,"Name":"Output","Type":"Constant","ContainerId":0,"PositionX":1454.1666666666667,"PositionY":222.14285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":1,"Name":"Pore","Type":"MembraneReceptor","ContainerId":1,"PositionX":378.7883124043404,"PositionY":293.0092058578739,"CellX":null,"CellY":null,"Angle":0},{"Id":3,"Name":"VS","Type":"MembraneReceptor","ContainerId":1,"PositionX":451.29012214872057,"PositionY":328.0311128390987,"CellX":null,"CellY":null,"Angle":45},{"Id":4,"Name":"CTD_connect","Type":"Default","ContainerId":1,"PositionX":399.06666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":5,"Name":"CTD","Type":"Default","ContainerId":1,"PositionX":351.56666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":28,"Name":"Pore","Type":"MembraneReceptor","ContainerId":2,"PositionX":628.7883124043486,"PositionY":293.00920585707354,"CellX":null,"CellY":null,"Angle":0},{"Id":29,"Name":"VS","Type":"MembraneReceptor","ContainerId":2,"PositionX":701.29012214872,"PositionY":328.03111283909914,"CellX":null,"CellY":null,"Angle":45},{"Id":30,"Name":"CTD_connect","Type":"Default","ContainerId":2,"PositionX":649.0666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0},{"Id":31,"Name":"CTD","Type":"Default","ContainerId":2,"PositionX":601.5666666666666,"PositionY":381.2285714285714,"CellX":null,"CellY":null,"Angle":0}],"Containers":[{"Id":1,"Name":"c1","Size":1,"PositionX":1,"PositionY":1},{"Id":2,"Name":"c2","Size":1,"PositionX":2,"PositionY":1}]},"ltl":{"states":[{"_type":"Keyframe","description":"Low out","name":"N","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}}]},{"_type":"Keyframe","description":"High out","name":"O","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}}]},{"_type":"Keyframe","description":"","name":"P","operands":[{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Potential"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P2"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P3"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"P4"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Output"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"Pore"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"VS"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":0}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD_connect"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}},{"_type":"KeyframeEquation","leftOperand":{"_type":"NameOperand","name":"CTD"},"operator":"=","rightOperand":{"_type":"ConstOperand","const":1}}]}],"operations":[{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"SelfLoopKeyframe"}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[null]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]},null]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[null,null]}]}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"OR","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"O"}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"N"}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"N"}]}]}]}]},{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Operation","operator":{"name":"ALWAYS","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"NOT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"N"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Operation","operator":{"name":"AND","operandsCount":2},"operands":[{"_type":"Keyframe","name":"O"},{"_type":"Operation","operator":{"name":"NEXT","operandsCount":1},"operands":[{"_type":"Keyframe","name":"O"}]}]}]}]}]}]}]}]}]}]}]}]},{"_type":"Operation","operator":{"name":"EVENTUALLY","operandsCount":1},"operands":[{"_type":"OscillationKeyframe"}]}]}]},"ltllayout":{"operationAppearances":[{"x":63.521009983588584,"y":475.7185619529539,"steps":10},{"x":-23.146608315098522,"y":550.9999999999999,"steps":10},{"x":-15.187508828148665,"y":291.28656293691836,"steps":10},{"x":-30.297190468427758,"y":356.1340706682899,"steps":10},{"x":-212.2578910543725,"y":39.747236759948976,"steps":10},{"x":-246.35164105437252,"y":179.74723675994898,"steps":10},{"x":-645.7578910543725,"y":402.747236759949,"steps":10},{"x":-645.2982604137453,"y":548.2511115882769,"steps":10},{"x":-364.18649021989563,"y":675.8910504871059,"steps":10},{"x":-253.13687327931143,"y":865.2712278448696,"steps":10},{"x":709.6846708806954,"y":719.0786811730429,"steps":10},{"x":697.9601441882176,"y":979.7956669128891,"steps":10},{"x":167.64658852522527,"y":1145.5756351731536,"steps":10},{"x":1150.4741180462097,"y":560.2553439370938,"steps":10},{"x":1914.4903237406295,"y":751.7152522853372,"steps":10},{"x":744.1097830858639,"y":-175.04651124010087,"steps":10},{"x":714.8431664225552,"y":-326.6047947197386,"steps":10},{"x":765.8183485578902,"y":58.11356101863927,"steps":10}]}}';
            var parsed = JSON.parse(str);
            var importedModel = BMA.Model.ImportModelAndLayout(parsed);
            var importedStates = BMA.Model.ImportLTLContents(parsed.ltl);

            it(" Should add ids of the first founded element from model", () => {

                var kfme1 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('Output', 27), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfm1 = new BMA.LTLOperations.Keyframe('N', "Low out", [kfme1]);

                var kfme2 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('Output', 27), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfm2 = new BMA.LTLOperations.Keyframe('O', 'High out', [kfme2]);

                var kfme3 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('Pore', 1), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme4 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('VS', 3), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfme5 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('CTD_connect', 4), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme6 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('CTD', 5), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme7 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('Potential', 6), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfme8 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('P2', 24), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme9 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('P3', 25), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfme10 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('P4', 26), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme11 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('Pore', 1), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfme12 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('VS', 3), '=', new BMA.LTLOperations.ConstOperand(0));
                var kfme13 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('CTD_connect', 4), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfme14 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand('CTD', 5), '=', new BMA.LTLOperations.ConstOperand(1));
                var kfm3 = new BMA.LTLOperations.Keyframe('P', '', [kfme3, kfme4, kfme5, kfme6, kfme7, kfme8, kfme9, kfme10, kfme1, kfme11, kfme12, kfme13, kfme14]);
                

                expect(BMA.ModelHelper.UpdateStatesWithModel(importedModel.Model, importedModel.Layout, importedStates.states)).toEqual({
                    states: [kfm1, kfm2, kfm3],
                    isChanged: true,
                    shouldNotify: true
                });

            });

        });

        describe("model with ids", () => {
            var kfm1 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand("name1", 34), "<", new BMA.LTLOperations.ConstOperand(2));
            var kfm2 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand("name2", 38), "=", new BMA.LTLOperations.ConstOperand(0));
            var kfm3 = new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand("name34", 34), "<", new BMA.LTLOperations.ConstOperand(2));

            var s1 = new BMA.LTLOperations.Keyframe("A", "", [kfm1]);
            var s2 = new BMA.LTLOperations.Keyframe("B", undefined, [kfm2]);
            var s3 = new BMA.LTLOperations.Keyframe("A", "", [kfm3]);

            var states = [s1, s2];

            var v3 = new BMA.Model.Variable(34, 15, BMA.Model.VariableTypes.Default, "name34", 3, 7, "formula1");

            it("States validation: model is not changed", () => {
                expect(BMA.ModelHelper.UpdateStatesWithModel(biomodel, layout, states)).toEqual({
                    states: states,
                    isChanged: false,
                    shouldNotify: false
                });
            });

            it("States validation: variable 'name1' removed", () => {
                biomodel = new BMA.Model.BioModel(name, [v2], []);
                expect(BMA.ModelHelper.UpdateStatesWithModel(biomodel, layout, states)).toEqual({
                    states: [s2],
                    isChanged: true,
                    shouldNotify: false
                });
            });

            it("States validation: variable 'name2' removed", () => {
                biomodel = new BMA.Model.BioModel(name, [v1], [r3]);
                expect(BMA.ModelHelper.UpdateStatesWithModel(biomodel, layout, states)).toEqual({
                    states: [s1],
                    isChanged: true,
                    shouldNotify: false
                });
            });

            it("States validation: variable 'name1' renamed", () => {
                biomodel = new BMA.Model.BioModel(name, [v3, v2], [r1, r2, r3]);
                expect(BMA.ModelHelper.UpdateStatesWithModel(biomodel, layout, states)).toEqual({
                    states: [s3, s2],
                    isChanged: true,
                    shouldNotify: false
                });
            });

            it("States validation: variable 'name34' added", () => {
                biomodel = new BMA.Model.BioModel(name, [v1, v2, v3], [r1, r2, r3]);
                expect(BMA.ModelHelper.UpdateStatesWithModel(biomodel, layout, states)).toEqual({
                    states: [s1, s2],
                    isChanged: false,
                    shouldNotify: false
                });
            });
        });

    });
}); 
