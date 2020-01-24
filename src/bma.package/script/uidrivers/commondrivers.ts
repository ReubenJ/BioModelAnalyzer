// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\widgets\drawingsurface.ts"/>

module BMA {
    export module UIDrivers {
        export class SVGPlotDriver implements ISVGPlot, IElementsPanel, INavigationPanel, IAreaHightlighter {
            private svgPlotDiv: JQuery;

            constructor(svgPlotDiv: JQuery) {
                this.svgPlotDiv = svgPlotDiv;
            }

            public Draw(svg: SVGElement) {
                this.svgPlotDiv.drawingsurface({ svg: svg });
            }

            public DrawLayer2(svg: SVGElement) {
                this.svgPlotDiv.drawingsurface({ lightSvg: svg });
            }

            public TurnNavigation(isOn: boolean) {
                this.svgPlotDiv.drawingsurface({ isNavigationEnabled: isOn });
            }

            public SetGrid(x0: number, y0: number, xStep: number, yStep: number) {
                this.svgPlotDiv.drawingsurface({ grid: { x0: x0, y0: y0, xStep: xStep, yStep: yStep } });
            }

            public GetDragSubject() {
                return this.svgPlotDiv.drawingsurface("getDragSubject");
            }

            public GetMouseMoves() {
                return this.svgPlotDiv.drawingsurface("getMouseMoves");
            }

            //public GetZoomSubject() {
            //    return this.svgPlotDiv.drawingsurface("getZoomSubject");
            //}

            public SetZoom(zoom: number) {
                this.svgPlotDiv.drawingsurface({ zoom: zoom });
            }

            public GetPlotX(left: number) {
                return this.svgPlotDiv.drawingsurface("getPlotX", left);
            }

            public GetPlotY(top: number) {
                return this.svgPlotDiv.drawingsurface("getPlotY", top);
            }

            public GetLeft(x: number) {
                return this.svgPlotDiv.drawingsurface("getLeft", x);
            }

            public GetTop(y: number) {
                return this.svgPlotDiv.drawingsurface("getTop", y);
            }

            public GetPixelWidth() {
                return this.svgPlotDiv.drawingsurface("getPixelWidth");
            }

            public SetGridVisibility(isOn: boolean) {
                this.svgPlotDiv.drawingsurface({ gridVisibility: isOn });
            }

            public HighlightAreas(areas: { x: number; y: number; width: number; height: number; fill: string }[]) {
                this.svgPlotDiv.drawingsurface({ rects: areas });
            }

            public SetCenter(x: number, y: number) {
                this.svgPlotDiv.drawingsurface("setCenter", { x: x, y: y });
            }

            public GetSVG() {
                return this.svgPlotDiv.drawingsurface("getSVG").toSVG();
            }

            public GetSVGRef() {
                return this.svgPlotDiv.drawingsurface("getSVG");
            }

            public GetLightSVGRef() {
                return this.svgPlotDiv.drawingsurface("getSecondarySVG");
            }


            public SetVisibleRect(rect: { x: number; y: number; width: number; height: number }) {
                this.svgPlotDiv.drawingsurface({ "visibleRect": rect });
            }

            public GetNavigationSurface() {
                return this.svgPlotDiv.drawingsurface("getCentralPart");
            }

            public SetConstraintFunc(f: Function) {
                this.svgPlotDiv.drawingsurface("setConstraint", f);
            }

            public MoveDraggableOnTop() {
                this.svgPlotDiv.drawingsurface("moveDraggableSvgOnTop");
            }

            public MoveDraggableOnBottom() {
                this.svgPlotDiv.drawingsurface("moveDraggableSvgOnBottom");
            }

            public SetConstraints(minWidth, maxWidth, minHeight, maxHeight) {
                if (minWidth != undefined) this.svgPlotDiv.drawingsurface({ minZoomWidth: minWidth });
                if (maxWidth != undefined) this.svgPlotDiv.drawingsurface({ maxZoomWidth: maxWidth });
                if (minHeight != undefined) this.svgPlotDiv.drawingsurface({ minZoomHeight: minHeight });
                if (maxHeight != undefined) this.svgPlotDiv.drawingsurface({ maxZoomHeight: maxHeight });
            }

            public DrawRects(rects: { x: number, y: number, width: number, height: number, fill: string }[]) {
                this.svgPlotDiv.drawingsurface({ "rects": rects });
            }

        }

        export class TurnableButtonDriver implements ITurnableButton {
            private button: JQuery;

            constructor(button: JQuery) {
                this.button = button;
            }

            public Turn(isOn: boolean) {
                this.button.button("option", "disabled", !isOn);
            }

        }

        export class VariableEditorDriver implements IVariableEditor {
            private variableEditor: JQuery;
            private onclosingCallback: Function;
            private onvariablechangedcallback: Function;
            private onformulachangedcallback: Function;

            constructor(variableEditor: JQuery) {
                this.variableEditor = variableEditor;
                this.variableEditor.bmaeditor();
                this.variableEditor.hide();

                this.variableEditor.click(function (e) { e.stopPropagation(); });
            }

            public GetVariableProperties(): { name: string; formula: string; rangeFrom: number; rangeTo: number; TFdescription: string } {
                return {
                    name: this.variableEditor.bmaeditor('option', 'name'),
                    formula: this.variableEditor.bmaeditor('getFormula'),//'option', 'formula'),
                    rangeFrom: this.variableEditor.bmaeditor('option', 'rangeFrom'),
                    rangeTo: this.variableEditor.bmaeditor('option', 'rangeTo'),
                    TFdescription: this.variableEditor.bmaeditor('option', 'TFdescription'),
                };
            }

            public SetValidation(val: boolean, message: string) {
                this.variableEditor.bmaeditor("SetValidation", val, message);
            }

            public Initialize(variable: BMA.Model.Variable, model: BMA.Model.BioModel, layout: BMA.Model.Layout) {
                this.variableEditor.bmaeditor('option', 'name', variable.Name);
                var options = [];
                var id = variable.Id;
                for (var i = 0; i < model.Relationships.length; i++) {
                    var rel = model.Relationships[i];
                    if (rel.ToVariableId === id) {
                        options.push(model.GetVariableById(rel.FromVariableId));
                    }
                }
                this.variableEditor.bmaeditor('option', 'inputs', options);
                this.variableEditor.bmaeditor('option', 'formula', variable.Formula);
                this.variableEditor.bmaeditor('option', 'rangeFrom', variable.RangeFrom);
                this.variableEditor.bmaeditor('option', 'rangeTo', variable.RangeTo);
                this.variableEditor.bmaeditor('option', 'TFdescription', layout.GetVariableById(variable.Id).TFDescription);

            }

            public Show(x: number, y: number) {
                this.variableEditor.show();
                this.variableEditor.css("left", x).css("top", y);
                this.variableEditor.bmaeditor("updateLayout");
            }

            public Hide() {
                this.variableEditor.hide();
                if (this.onclosingCallback !== undefined) {
                    this.onclosingCallback();
                }
            }

            public SetOnClosingCallback(callback: Function) {
                this.onclosingCallback = callback;
                this.variableEditor.bmaeditor({ oneditorclosing: callback });
            }

            public SetOnVariableEditedCallback(callback: Function) {
                this.onvariablechangedcallback = callback;
                this.variableEditor.bmaeditor({
                    onvariablechangedcallback: callback
                });
            }

            public SetOnFormulaEditedCallback(callback: Function) {
                this.onformulachangedcallback = callback;
                this.variableEditor.bmaeditor({
                    onformulachangedcallback: callback
                });
            }

            public IsVisible(): boolean {
                return this.variableEditor.is(":visible");
            }
        }

        export class ContainerEditorDriver implements IContainerEditor {
            private containerEditor: JQuery;
            private onClosingCallback: Function;

            constructor(containerEditor: JQuery) {
                this.containerEditor = containerEditor;
                this.containerEditor.containernameeditor();
                this.containerEditor.hide();

                this.containerEditor.click(function (e) { e.stopPropagation(); });
            }

            public GetContainerName(): string {
                return this.containerEditor.containernameeditor('option', 'name');
            }

            Initialize(containerLayout: BMA.Model.ContainerLayout) {
                this.containerEditor.containernameeditor('option', 'name', containerLayout.Name);
            }

            public Show(x: number, y: number) {
                this.containerEditor.show();
                this.containerEditor.css("left", x).css("top", y);
            }

            public Hide() {
                this.containerEditor.hide();
                if (this.onClosingCallback !== undefined) {
                    this.onClosingCallback();
                }
            }

            public SetOnClosingCallback(callback: Function) {
                this.onClosingCallback = callback;
                this.containerEditor.containernameeditor({ oneditorclosing: callback });
            }
        }

        export class ProofViewer implements IProofResultViewer {
            private proofAccordion: JQuery;
            private proofContentViewer: JQuery;

            constructor(proofAccordion, proofContentViewer) {
                this.proofAccordion = proofAccordion;
                this.proofContentViewer = proofContentViewer;
            }

            public SetData(params) {
                if (params !== undefined)
                    this.proofContentViewer.proofresultviewer(params);
            }

            public ShowResult(result: BMA.Model.ProofResult) {
                this.proofAccordion.bmaaccordion({ contentLoaded: { ind: "#icon1", val: true } });
            }

            public OnProofStarted() {
                this.proofAccordion.bmaaccordion({ contentLoaded: { ind: "#icon1", val: false } });
            }

            public OnProofFailed() {
                $("#icon1").click();
            }

            public Show(params: any) {
                this.proofContentViewer.proofresultviewer("show", params.tab);
            }


            public Hide(params) {
                this.proofContentViewer.proofresultviewer("hide", params.tab);
            }

        }

        export class FurtherTestingDriver implements IFurtherTesting {

            private viewer: JQuery;

            constructor(viewer: JQuery, toggler: JQuery) {
                this.viewer = viewer;
            }

            public GetViewer() {
                return this.viewer;
            }

            public ShowStartFurtherTestingToggler() {
                this.viewer.furthertesting("ShowStartToggler");
            }

            public HideStartFurtherTestingToggler() {
                this.viewer.furthertesting("HideStartToggler");
            }

            public ShowResults(data) {
                if (data !== undefined)
                    this.viewer.furthertesting("SetData", { tabLabels: data.tabLabels, tableHeaders: data.tableHeaders, data: data.data });
                else { this.viewer.furthertesting("SetData", undefined) }
            }

            public HideResults() {
                this.viewer.furthertesting({ data: null });
            }

            public StandbyMode() {
                this.viewer.furthertesting({ buttonMode: "StandbyMode" });
            }

            public ActiveMode() {
                this.viewer.furthertesting({ buttonMode: "ActiveMode" });
            }
        }


        export class PopupDriver implements IPopup {
            private popupWindow: JQuery;
            constructor(popupWindow: JQuery) {
                this.popupWindow = popupWindow;
            }

            public Seen() {
                return !this.popupWindow.is(":hidden");
            }

            public Show(params: any) {
                var that = this;
                //this.createResultView(params);
                var header = "";
                this.popupWindow
                    .removeClass('further-testing-popout')
                    .removeClass('proof-propagation-popout')
                    .removeClass('proof-variables-popout')
                    .removeClass('simulation-popout')
                //.removeClass('analysis-popout');

                switch (params.tab) {
                    case "ProofVariables":
                        header = "Variables";
                        this.popupWindow.addClass('proof-variables-popout');
                        break;
                    case "ProofPropagation":
                        header = "Proof Progression";
                        this.popupWindow.addClass('proof-propagation-popout');
                        break;
                    case "SimulationVariables":
                        header = "Simulation Progression";
                        this.popupWindow.addClass('simulation-popout');
                        break;
                    case "FurtherTesting":
                        header = "Further Testing";
                        this.popupWindow.addClass('further-testing-popout')
                        break;
                    case "SimulationPlot":
                        header = "Simulation Graph";
                        //this.popupWindow.addClass('analysis-popout');
                        break;
                }
                this.popupWindow.resultswindowviewer({ header: header, tabid: params.tab, content: params.content, icon: "min", isResizable: false, paddingOn: true });
                popup_position();
                this.popupWindow.show();
            }

            public Hide() {
                this.popupWindow.hide();
            }

            public Collapse() {
                window.Commands.Execute("Collapse", this.popupWindow.resultswindowviewer("option", "tabid"));
            }
        }

        export class SimulationExpandedDriver implements ISimulationExpanded {
            private viewer;
            private onplotvariablesselectionchanged;
            private createStateRequested;

            constructor(view: JQuery) {
                this.viewer = view;
            }

            public SetOnPlotVariablesSelectionChanged(callback) {
                this.onplotvariablesselectionchanged = callback;
                this.viewer.simulationexpanded({ onChangePlotVariables: callback });
            }

            public SetOnCreateStateRequested(callback) {
                if (this.viewer !== undefined) {
                    this.viewer.simulationexpanded({
                        columnContextMenuItems: [{ title: "Create LTL State", cmd: "CreateState" }],
                        createStateRequested: callback
                    });
                } else {
                    this.createStateRequested = callback;
                }
            }

            public Set(data: { variables; colors; init }) {
                var table = this.CreateExpandedTable(data.variables, data.colors);
                var interval = this.CreateInterval(data.variables);
                this.viewer.simulationexpanded({ variables: table, init: data.init, interval: interval, data: undefined });
            }

            public SetNumberOfSteps(num) {
                this.viewer.simulationexpanded({ num: num });
            }

            public SetData(data) {
                var toAdd = this.CreatePlotView(data);
                this.viewer.simulationexpanded("option", "data", toAdd);
            }

            public GetViewer(): JQuery {
                return this.viewer;
            }

            public StandbyMode() {
                this.viewer.simulationexpanded({ buttonMode: "StandbyMode" });
            }

            public ActiveMode() {
                this.viewer.simulationexpanded({ buttonMode: "ActiveMode" });
            }

            public AddResult(res) {
                var result = this.ConvertResult(res);
                this.viewer.simulationexpanded("AddResult", result);
            }

            public CreatePlotView(colors) {
                var data = [];
                for (var i = 1; i < colors[0].Plot.length; i++) {
                    data[i - 1] = [];
                    for (var j = 0; j < colors.length; j++) {
                        data[i - 1][j] = colors[j].Plot[i];
                    }
                }
                return data;
            }

            public CreateInterval(variables) {
                var table = [];
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = variables[i].RangeFrom;
                    table[i][1] = variables[i].RangeTo;
                }
                return table;
            }

            public ConvertResult(res) {

                var data = [];
                if (res.Variables !== undefined && res.Variables !== null)
                    data = [];
                for (var i = 0; i < res.Variables.length; i++)
                    data[i] = res.Variables[i].Value;
                return data;
            }

            public findColorById(colors, id) {
                for (var i = 0; i < colors.length; i++)
                    if (id === colors[i].Id)
                        return colors[i];
                return undefined;
            }

            public CreateExpandedTable(variables, colors) {
                var table = [];
                //var variables = this.appModel.BioModel.Variables;
                for (var i = 0; i < variables.length; i++) {
                    table[i] = [];
                    table[i][0] = this.findColorById(colors, variables[i].Id).Color;
                    table[i][1] = this.findColorById(colors, variables[i].Id).Seen;
                    table[i][2] = variables[i].Name;
                    table[i][3] = variables[i].RangeFrom
                    table[i][4] = variables[i].RangeTo;
                }
                return table;
            }
        }

        export class SimulationViewerDriver implements ISimulationViewer {
            private viewer;

            constructor(viewer) {
                this.viewer = viewer;
            }

            public ChangeVisibility(param) {
                this.viewer.simulationviewer("ChangeVisibility", param.ind, param.check);
            }

            public SetData(params) {
                this.viewer.simulationviewer(params);
            }

            public Show(params: any) {
                this.viewer.simulationviewer("show", params.tab);
            }

            public Hide(params) {
                this.viewer.simulationviewer("hide", params.tab);
            }
        }

        export class LocalStorageDriver implements ILocalStorageDriver {
            private widget;

            constructor(widget: JQuery) {
                this.widget = widget;
            }

            public AddItem(key) {
                this.widget.localstoragewidget("AddItem", key);
            }

            public SetActiveModel(modelName) {
                this.widget.localstoragewidget("SetActiveModel", modelName);
            }

            public SetOnUnselect() {
                this.widget.localstoragewidget("CancelSelection");
            }

            public SetOnEnableContextMenu(enable: boolean) {
                this.widget.localstoragewidget({
                    enableContextMenu: enable
                });
            }

            public SetItems(keys) {
                this.widget.localstoragewidget({ items: keys });
            }

            public SetOnRequestLoadModel(callback: Function) {
                this.widget.localstoragewidget({
                    onloadmodel: callback
                });
            }

            public SetOnRemoveModel(callback: Function) {
                this.widget.localstoragewidget({
                    onremovemodel: callback
                });
            }

            public SetOnCopyToOneDriveCallback(callback: Function) {
                this.widget.localstoragewidget({
                    setoncopytoonedrive: callback
                });
            }

            //public Show() {
            //    this.widget.show();
            //}

            //public Hide() {
            //    this.widget.hide();
            //}

            public Message(msg: string) {
                this.widget.localstoragewidget("Message", msg);
            }
        }

        export class OneDriveStorageDriver implements IOneDriveDriver {
            private widget;

            constructor(widget: JQuery) {
                this.widget = widget;
            }

            public AddItem(key) {
                this.widget.onedrivestoragewidget("AddItem", key);
            }

            public SetItems(keys) { //keys = { id, name }
                this.widget.onedrivestoragewidget({ items: keys });
            }

            public SetActiveModel(modelName) {
                this.widget.onedrivestoragewidget("SetActiveModel", modelName);
            }

            public SetOnLoading(flag: boolean) {
                this.widget.onedrivestoragewidget({ loading: flag });
            }

            public SetOnUnselect() {
                this.widget.onedrivestoragewidget("CancelSelection");
            }

            public SetOnRequestLoadModel(callback: Function) {
                this.widget.onedrivestoragewidget({
                    onloadmodel: callback
                });
            }

            public SetOnRemoveModel(callback: Function) {
                this.widget.onedrivestoragewidget({
                    onremovemodel: callback
                });
            }

            //public Show() {
            //    this.widget.show();
            //}

            //public Hide() {
            //    this.widget.hide();
            //}

            public Message(msg: string) {
                this.widget.onedrivestoragewidget("Message", msg);
            }

            public SetOnShareCallback(callback: Function) {
                this.widget.onedrivestoragewidget({
                    setonsharecallback: callback
                });
            }

            public SetOnActiveShareCallback(callback: Function) {
                this.widget.onedrivestoragewidget({
                    setonactivesharecallback: callback
                });
            }

            public SetOnOpenBMALink(callback: Function) {
                this.widget.onedrivestoragewidget({
                    setonopenbmalink: callback
                });
            }

            public SetOnCopyToLocalCallback(callback: Function) {
                this.widget.onedrivestoragewidget({
                    setoncopytolocal: callback
                });
            }
            
        }

        export class ModelStorageDriver implements IModelStorageDriver {
            private ldriver: LocalStorageDriver;
            private oddriver: OneDriveStorageDriver;
            private widget;
            private mode: string = "local";

            constructor(widget: JQuery, ldriver: LocalStorageDriver, oddriver: OneDriveStorageDriver) {
                this.widget = widget;

                this.ldriver = ldriver;
                this.oddriver = oddriver;
            }

            public Show() {
                this.widget.show();
            }

            public Hide() {
                this.widget.hide();
            }

            public SetAuthorizationStatus(status: boolean) {
                this.widget.modelstoragewidget({ isAuthorized: status });
            }

            public SetOnUpdateModelList(callback: Function) {
                this.widget.modelstoragewidget({
                    updatemodellistcallback: callback
                });
            }

            //public SetOnSignInCallback(callback: Function) {
            //    this.widget.modelstoragewidget({
            //        onsigninonedrive: callback
            //    });
            //}

            //public SetOnSignOutCallback(callback: Function) {
            //    this.widget.modelstoragewidget({
            //        onsignoutonedrive: callback
            //    });
            //}

        }

        export class ModelFileLoader implements IFileLoader {
            private fileInput: JQuery;
            private currentPromise = undefined;

            constructor(fileInput: JQuery) {
                var that = this;
                this.fileInput = fileInput;

                fileInput.change(function (arg) {
                    var e: any = arg;
                    if (e.target.files !== undefined && e.target.files.length == 1 && that.currentPromise !== undefined) {
                        that.currentPromise.resolve(e.target.files[0]);
                        that.currentPromise = undefined;
                        fileInput.val("");
                    }
                });
            }

            public OpenFileDialog(): JQueryPromise<File> {
                var deferred = $.Deferred();
                this.currentPromise = deferred;
                this.fileInput.click();
                return <JQueryPromise<File>>deferred.promise();
            }

            private OnCheckFileSelected(): boolean {
                return false;
            }
        }

        export class ContextMenuDriver implements IContextMenu {
            private contextMenu: JQuery;

            constructor(contextMenu: JQuery) {
                this.contextMenu = contextMenu;
            }

            public EnableMenuItems(optionVisibilities: { name: string; isEnabled: boolean }[]) {
                for (var i = 0; i < optionVisibilities.length; i++) {
                    this.contextMenu.contextmenu("enableEntry", optionVisibilities[i].name, optionVisibilities[i].isEnabled);
                }
            }

            public ShowMenuItems(optionVisibilities: { name: string; isVisible: boolean }[]) {
                for (var i = 0; i < optionVisibilities.length; i++) {
                    this.contextMenu.contextmenu("showEntry", optionVisibilities[i].name, optionVisibilities[i].isVisible);
                }
            }

            public GetMenuItems() {
                return [];
            }
        }

        export class AccordionHider implements IHider {
            private acc: JQuery;

            constructor(acc: JQuery) {
                this.acc = acc;
            }

            public ContentLoaded(index, value) {
                this.acc.bmaaccordion({ contentLoaded: { ind: index, val: value } });
            }

            public Hide() {
                var coll = this.acc.children().filter('[aria-selected="true"]').trigger("click");
            }

            public HideTab(ind) {
                var searchString = "[aria-controls = 'tabs-" + ind + "']";
                var tab = this.acc.find(searchString);
                tab.trigger("click");
            }
        }

        export class BMAProcessingService implements IServiceDriver {
            protected serviceURL: string;

            constructor(serviceURL: string) {
                this.serviceURL = serviceURL;
            }

            public Invoke(data): JQueryPromise<any> {
                var that = this;
                var result = $.Deferred();

                $.ajax({
                    type: "POST",
                    url: that.serviceURL,
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    statusCode: {
                        200: function (res) {
                            result.resolve(res);
                        },
                        204: function (res) {
                            result.reject({}, "Operation was not competed within time limit", "Processing Timeout");
                        }
                    }
                }).fail(function (xhr, textStatus, errorThrown) {
                    result.reject(xhr, textStatus, errorThrown);
                });

                return result.promise();
            }
        }

        export class BMALRAProcessingService implements IServiceDriver {
            private serviceURL: string;
            private userID: string;

            constructor(serviceURL: string, userID: string) {
                this.serviceURL = serviceURL;
                this.userID = userID;
            }

            public Invoke(data): JQueryPromise<any> {
                var that = this;
                var result = $.Deferred();
                var promise = result.promise();
                (<any>promise).abort = function () {
                };

                result.progress(function (res) {
                    return res;
                });

                $.ajax({
                    type: "POST",
                    url: that.serviceURL + that.userID,
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                }).done(function (id) {
                    (<any>promise).abort = function () {
                        console.log("Canceled");
                        that.CancelRequest(id);
                        result.reject();
                    };
                    that.CheckStatusOfRequest(id, result);
                }).fail(function (xhr, textStatus, errorThrown) {
                    result.reject(xhr, textStatus, errorThrown);
                });

                return promise;
            }

            private CancelRequest(id) {
                var that = this;
                $.ajax({
                    type: "DELETE",
                    url: that.serviceURL + that.userID + "/?jobId=" + id,
                });
            }

            private CheckStatusOfRequest(id, result) {
                var that = this;
                if (result.state() == "pending") {
                    console.log("polling to LRA service ... ");
                    $.ajax({
                        type: "GET",
                        url: that.serviceURL + that.userID + "/?jobId=" + id,
                        statusCode: {
                            200: function (res) {
                                $.ajax({
                                    type: "GET",
                                    url: that.serviceURL + that.userID + "/result?jobId=" + id,
                                    statusCode: {
                                        200: function (res) {
                                            result.resolve(res);
                                        },
                                        404: function (xhr, textStatus, errorThrown) {
                                            result.reject(xhr, textStatus, errorThrown);
                                        }
                                    }
                                });
                            },
                            201: function (res) {
                                var notification = "Number ";
                                var number = parseFloat(res) + 1;
                                if (number !== NaN && number > 0)
                                    notification += number + " in queue";
                                else notification = "Queued";
                                result.notify(notification);
                                setTimeout(() => { that.CheckStatusOfRequest(id, result); }, 10000);
                            },
                            202: function (res) {
                                var notification = "Executing ";
                                var timemls = parseFloat(res.elapsed);
                                if (timemls < 0) throw "Server Error: Elapsed time cannot be negative";
                                if (timemls) {
                                    var executingTime = Math.floor(timemls / 1000);
                                    if (executingTime < 60)
                                        notification += "since " + executingTime + " second" + (Math.abs(executingTime) > 1 ? "s" : "");
                                    else {
                                        executingTime = Math.floor(executingTime / 60);
                                        if (executingTime > 60) {
                                            executingTime = Math.floor(executingTime / 60);
                                            notification += "since " + executingTime + " hour" + (Math.abs(executingTime) > 1 ? "s": "");
                                        } else
                                            notification += "since " + executingTime + " min" + (Math.abs(executingTime) > 1 ? "s" : "");
                                    }
                                }
                                result.notify(notification);
                                setTimeout(() => { that.CheckStatusOfRequest(id, result); }, 10000);
                            },
                            203: function (xhr, textStatus, errorThrown) {
                                result.reject(xhr, textStatus, errorThrown);
                            },
                            404: function (xhr, textStatus, errorThrown) {
                                result.reject(xhr, textStatus, errorThrown);
                            },
                            501: function (res) {
                                result.notify(res);
                            }
                        }
                    });
                }
            }

        }

        export class LTLAnalyzeService implements IServiceDriver {
            private url: string;
            private maxRequestCount: number = 1;
            private pendingRequests: { data: any; deferred: JQueryDeferred<any> }[];
            private currentActiveRequestCount: number = 0;

            constructor(url: string, maxRequestCount: number) {
                this.url = url;
                this.maxRequestCount = maxRequestCount;
                this.pendingRequests = [];
                this.currentActiveRequestCount = 0;
            }

            public Invoke(data): JQueryPromise<any> {
                var that = this;
                var deferred = $.Deferred<any>();
                this.pendingRequests.push({ data: data, deferred: deferred });
                this.ShiftRequest();
                return deferred.promise();
            }

            private ShiftRequest() {
                var that = this;
                if (this.pendingRequests.length > 0) {
                    var request = this.pendingRequests.shift();

                    if (this.currentActiveRequestCount < this.maxRequestCount) {
                        this.currentActiveRequestCount++;
                        $.ajax({
                            type: "POST",
                            url: that.url,
                            data: JSON.stringify(request.data),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            statusCode: {
                                200: function (res) {
                                    that.currentActiveRequestCount--;
                                    that.ShiftRequest();
                                    request.deferred.resolve(res);
                                },
                                204: function (res) {
                                    that.currentActiveRequestCount--;
                                    that.ShiftRequest();
                                    request.deferred.reject({}, "Operation was not competed within time limit", "Processing Timeout");
                                }
                            }
                        }).fail(function (xhr, textStatus, errorThrown) {
                            that.currentActiveRequestCount--;
                            that.ShiftRequest();
                            request.deferred.reject(xhr, textStatus, errorThrown);
                        });
                    } else {
                        this.pendingRequests.push(request);
                    }
                }
            }
        }

        export class MessageBoxDriver implements IMessageServiсe {

            public Show(message: string) {
                var userDialog = $('<div></div>').appendTo('body').userdialog({
                    message: message,
                    actions: [
                        {
                            button: 'Ok',
                            callback: function () { userDialog.detach(); }
                        }
                    ]
                });
            }

            public Log(message: string) {
                console.log(message);
            }
        }

        export class ExportService implements IExportService {
            public Export(content: string, name: string, extension: string) {
                var ret = saveTextAs(content, name + '.' + extension);
            }
        }

        export class LoadingWaitScreen implements IWaitScreen {
            private bannerDiv: JQuery;

            constructor(bannerDiv: JQuery) {
                this.bannerDiv = bannerDiv;
            }

            public Show() {
                this.bannerDiv.show();
            }

            public Hide() {
                this.bannerDiv.hide();
            }
        }

        export class DrawingSurfaceDragnDropExtender implements IDragnDropExtender {
            private popups: JQuery[];
            private drawingSurface: JQuery;

            constructor(drawingSurface: JQuery, popups: JQuery[]) {
                this.drawingSurface = drawingSurface;
                this.popups = popups;
            }

            HandleDrop(screenLocation: { x: number; y: number }, dropObject: any): boolean {

                for (var i = 0; i < this.popups.length; i++) {
                    var popup = this.popups[i];

                    if (!popup.is(":visible"))
                        continue;

                    var popupPosition = popup.offset();
                    var w = popup.width();
                    var h = popup.height();

                    var isInsidePopup = (screenLocation.y > popupPosition.top && screenLocation.y < popupPosition.top + h) &&
                        (screenLocation.x > popupPosition.left && screenLocation.x < popupPosition.left + w)

                    if (isInsidePopup) {
                        window.Commands.Execute("HandlePopupDrop", {
                            screenLocation: screenLocation,
                            dropObject: dropObject
                        });

                        return true;
                    }
                }

                return false;
            }
        }

    }
} 
