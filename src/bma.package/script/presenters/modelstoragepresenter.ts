﻿// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
module BMA {
    export module Presenters {
        export class ModelStoragePresenter {
            constructor(
                appModel: BMA.Model.AppModel,
                fileLoaderDriver: BMA.UIDrivers.IFileLoader,
                checker: BMA.UIDrivers.ICheckChanges,
                logService: BMA.ISessionLog,
                exportService: BMA.UIDrivers.ExportService,
                waitScreen: BMA.UIDrivers.IWaitScreen,
                messageBox: BMA.UIDrivers.IMessageServiсe) {
                var that = this;

                window.Commands.On("NewModel",(args) => {
                    try {
                        if (checker.IsChanged(appModel)) {
                            var userDialog = $('<div></div>').appendTo('body').userdialog({
                                message: "Model has unsaved changes.\nDo you want to continue?",
                                //"Do you want to save changes?",
                                actions: [
                                    //{
                                    //    button: 'Yes',
                                    //    callback: function () { userDialog.detach(); }
                                    //},
                                    {
                                        button: 'Yes',
                                        callback: function () {
                                            userDialog.detach();
                                            load();
                                        }
                                    },
                                    {
                                        button: 'Cancel',
                                        callback: function () { userDialog.detach(); }
                                    }
                                ]
                            });
                        }
                        else load();
                    }
                    catch (ex) {
                        load();
                    }

                    function load() {
                        window.Commands.Execute('SetPlotSettings', { MaxWidth: 3200, MinWidth: 800 });
                        window.Commands.Execute('ModelFitToView', '');
                        appModel.Deserialize(undefined);
                        checker.Snapshot(appModel);
                        logService.LogNewModelCreated();
                    }
                });

                window.Commands.On("ImportModel", (args) => {
                    try {
                        if (checker.IsChanged(appModel)) {
                            var userDialog = $('<div></div>').appendTo('body').userdialog({
                                message: "Model has unsaved changes.\nDo you want to continue?",
                                //"Do you want to save changes?",
                                actions: [
                                    //{
                                    //    button: 'Yes',
                                    //    callback: function () { userDialog.detach(); }
                                    //},
                                    {
                                        button: 'Yes',
                                        callback: function () {
                                            userDialog.detach();
                                            logService.LogImportModel();
                                            load();
                                        }
                                    },
                                    {
                                        button: 'Cancel',
                                        callback: function () { userDialog.detach(); }
                                    }
                                ]
                            });
                        }
                        else {
                            logService.LogImportModel();
                            load();
                        }
                    }
                    catch (ex) {
                        messageBox.Show(ex); 
                        logService.LogImportModel();
                        load();
                    }

                    function load() {
                        window.Commands.Execute('SetPlotSettings', { MaxWidth: 3200, MinWidth: 800 });
                        window.Commands.Execute('ModelFitToView', '');
                        fileLoaderDriver.OpenFileDialog().done(function (fileName) {
                            waitScreen.Show();

                            var fileReader: any = new FileReader();
                            fileReader.onload = function () {
                                var fileContent = fileReader.result;

                                var s = fileName.name.split('.');
                                if (s.length > 1 && s[s.length - 1] == "ginml") {
                                    var data = $.parseXML(fileContent);
                                    var model = BMA.ParseGINML(data, window.GridSettings);
                                    appModel.Reset(model.Model, model.Layout);
                                }
                                else {

                                    try {
                                        var data = $.parseXML(fileContent);
                                        var model = BMA.ParseXmlModel(data, window.GridSettings);
                                        appModel.Reset(model.Model, model.Layout);

                                    }
                                    catch (exc) {
                                        console.log("XML parsing failed: " + exc + ". Trying JSON");
                                        try {
                                            appModel.Deserialize(fileReader.result);
                                        }
                                        catch (exc2) {
                                            console.log("JSON failed: " + exc + ". Trying legacy JSON version");
                                            appModel.DeserializeLegacyJSON(fileReader.result);
                                        }
                                    }
                                }
                                checker.Snapshot(appModel);
                                waitScreen.Hide();
                            };
                            
                            fileReader.readAsText(fileName);
                        });
                        
                    }
                });

                window.Commands.On("ExportModel",(args) => {
                    try {
                        var data = appModel.Serialize();
                        exportService.Export(data, appModel.BioModel.Name, 'json');
                        //var ret = saveTextAs(data, appModel.BioModel.Name + ".json");
                        checker.Snapshot(appModel);
                    }
                    catch (ex) {
                        messageBox.Show("Couldn't export model: " + ex);
                    }
                });
            }
        }
    }
} 
