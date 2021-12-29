// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>
/// <reference path="..\..\script\uidrivers\commoninterfaces.ts"/>

module BMA {
    export module Test {

        export class TestWaitScreen implements BMA.UIDrivers.IWaitScreen {
            constructor() { }
            Show() { }
            Hide() { }
        }

        export class ModelRepositoryTest implements BMA.UIDrivers.IModelRepository {

            private modelsList = [];
            private motifList = [];

            GetModelList(): JQueryPromise<string[]>{
                var result = $.Deferred();
                var list: string[] = [];
                for (var attr in this.modelsList) {
                    var usrkey = this.IsUserKey(attr);
                    if (usrkey !== undefined) {
                        list.push(usrkey);
                    }
                }
                result.resolve(list);

                return <JQueryPromise<string[]>>result.promise();
            }

            GetMotifList(): JQueryPromise<string[]> {
                var result = $.Deferred();
                var list: string[] = [];
                for (var attr in this.motifList) {
                    var usrkey = this.IsUserKey(attr);
                    if (usrkey !== undefined) {
                        list.push(usrkey);
                    }
                }
                result.resolve(list);

                return <JQueryPromise<string[]>>result.promise();
            }


            GetModels(): JQueryPromise<JSON[]> {
                throw "Not Implemented";
            }

            LoadModel(id: string): JQueryPromise<JSON> {
                //var i = parseInt(id);
                //if (i < this.modelsList.length) {
                //    return JSON.parse('{"test": ' + this.modelsList[i] + '}');
                //}
                var result = $.Deferred();
                result.resolve(JSON.parse('{"test": ' + this.modelsList[id] + '}'));
                return <JQueryPromise<JSON>>result.promise();
            }

            RemoveModel(id: string) {
                var newlist = [];
                for (var i in this.modelsList) {
                    if (i !== id)
                        newlist.push(i);//this.modelsList[i]);
                }
                this.modelsList = newlist;
            }

            SaveModel(id: string, model: JSON) {
                this.modelsList[id] = JSON.stringify(model);
            }

            IsInRepo(id: string) {
                return this.modelsList[id] !== undefined;
            }

            IsUserKey(key: string): string {
                var sp = key.split('.');
                if (sp[0] === "user") {
                    var q = sp[1];
                    for (var i = 2; i < sp.length; i++) {
                        q = q.concat('.');
                        q = q.concat(sp[i]);
                    }
                    return q;
                }
                else return undefined;
            }
            //OnRepositoryUpdated();

            GetMotifs(): JQueryPromise<JSON[]> { throw "not implemented"; }
            LoadMotif(id: string): JQueryPromise<JSON> { throw "not implemented"; }
            RemoveMotif(id: string) { throw "not implemented"; }
            SaveMotif(id: string, motif: JSON) { throw "not implemented"; }
        }

        export class LocalStorageTestDriver implements BMA.UIDrivers.ILocalStorageDriver {
            private widget;

            constructor(widget: JQuery) {
                this.widget = widget;
            }

            public Message(msg: string) {
                this.widget.localstoragewidget("Message", msg);
            }

            public AddItem(key, item) {
                this.widget.localstoragewidget("AddItem", key);
            }

            public SetActiveModel(modelName) {
                this.widget.localstoragewidget("SetActiveModel", modelName);
            }

            public SetOnUnselect() {
                this.widget.localstoragewidget("CancelSelection");
            }

            public Show() {
            }

            public Hide() {
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

            public SetOnEnableContextMenu(enable: boolean) {
                this.widget.localstoragewidget({
                    enableContextMenu: enable
                });
            }
        }

        export class VariableEditorTestDriver implements BMA.UIDrivers.IVariableEditor {

            private variable: BMA.Model.Variable;
            private model: BMA.Model.BioModel;
            private layout: BMA.Model.Layout;

            public get Variable() {
                return this.variable;
            }

            public get Model() {
                return this.model;
            }

            public GetVariableProperties(): { name: string; formula: string; rangeFrom: number; rangeTo: number; TFdescription: string;} {
        return {
                    name: this.variable.Name,
                    formula: this.variable.Formula,
                    rangeFrom: this.variable.RangeFrom,
                    rangeTo: this.variable.RangeTo,
                    TFdescription: this.layout.GetVariableById(this.variable.Id).TFDescription
                }
    }

            public Initialize(variable: BMA.Model.Variable, model: BMA.Model.BioModel) {
                this.variable = variable;
                this.model = model;
            }

            public Show(x: number, y: number) { }

            public Hide() { }

            public SetValidation(val: boolean, message: string) { }

            public SetOnClosingCallback(callback: Function) { };

            public SetOnVariableEditedCallback(callback: Function) { };

            public SetOnFormulaEditedCallback(callback: Function) { };

            public IsVisible() {
                return false;
            };
        }


        export class AjaxTestDriver implements BMA.UIDrivers.IServiceDriver {
            public Invoke(data): JQueryPromise<any> {
                var deferred = $.Deferred();
                var result: { IsValid: boolean; Message: string };
                //switch (url) {
                //    case "api/Validate":
                //        if (data.Formula === "true")
                //            result = { IsValid: true, Message: "Ok" };
                //    default:
                //            result = { IsValid: false, Message: "Not Ok" };
                        
                //}
                result = { IsValid: true, Message: "Ok" };
                console.log("result: " + result.IsValid);
                deferred.resolve(result);
                return deferred.promise();
            }
        }

        export class NavigationTestDriver implements BMA.UIDrivers.INavigationPanel {
            private ison = false;
            private zoom = 1;
            private center = { x: 0, y: 0 };

            public get IsOn() { return this.ison; }
            public get Zoom() { return this.zoom; }
            public get Center() { return this.center; }

            public TurnNavigation(isOn: boolean) { this.ison = isOn; }
            public SetZoom(zoom: number) { this.zoom = zoom; }
            public SetCenter(x: number, y: number) { this.center = { x: x, y: y }; }
            public MoveDraggableOnTop() { }
            public MoveDraggableOnBottom() { }

            public GetNavigationSurface() {
                return {
                    master: undefined
                };
            }
        }
    }
}

