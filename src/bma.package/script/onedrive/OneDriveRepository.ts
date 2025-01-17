// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>

module BMA.OneDrive {
    export class OneDriveUserProfile {
        id: string;
        first_name: string;
        last_name: string;
        imageUri: string;
    }

    export interface OneDriveFile extends BMA.UIDrivers.ModelInfo {
    }

    /// Represents a OneDrive file which is shared with the user by someone else.
    export interface SharedOneDriveFile extends BMA.UIDrivers.ModelInfo {        
    }

    export class LoginFailure {
        public error: any;
        public error_description: any;
    }

    export interface IOneDrive {
        GetUserProfile(): JQueryPromise<OneDriveUserProfile>;

        /// Creates a root folder.
        /// Returns its ID.
        CreateFolder(name: string): JQueryPromise<string>;

        // Finds a root folder with given name.
        // Returns its ID or null, if the folder is not found.
        FindFolder(name: string): JQueryPromise<string>;

        EnumerateFiles(folderId: string): JQueryPromise<OneDriveFile[]>;
        EnumerateSharedWithMeFiles(): JQueryPromise<SharedOneDriveFile[]>;

        /// Creates or replaces a file in the given folder. 
        /// Returns the saved file information.
        SaveFile(folderId: string, name: string, content: JSON): JQueryPromise<OneDriveFile>;

        FileExists(fileId: string): JQueryPromise<boolean>;

        LoadFile(fileId: string): JQueryPromise<JSON>;

        /// Returns true, if the operation is successful.
        RemoveFile(fileId: string): JQueryPromise<boolean>;
    }

    export interface IOneDriveConnector {
        Enable(onLogin: (oneDrive: IOneDrive) => void, onLoginFailed: (error: LoginFailure) => void, onLogout: (any) => void): void;
    }

    //************************************************************************************************
    // 
    // Models and repository
    //
    //************************************************************************************************
    export class OneDriveRepository {
        private static bmaModelFolder = "BioModelAnalyzer";
        private static bmaMotifFolder = "BioModelAnalyzerMotifs";

        private oneDrive: IOneDrive;
        private modelfolderId: string;
        private motiffolderId: string;


        constructor(oneDrive: IOneDrive) {
            this.oneDrive = oneDrive;
            this.modelfolderId = null;
            this.motiffolderId = null;
        }

        private static UpdateName(file: OneDriveFile): OneDriveFile {
            var name = file.name;
            if (name.lastIndexOf(".json") === name.length - 5) {
                file.name = name.substr(0, name.length - 5);
            }
            return file;
        }

        private static UpdateNames(files: OneDriveFile[]): OneDriveFile[] {
            for (var i = 0; i < files.length; i++) {
                OneDriveRepository.UpdateName(files[i]);
            }
            return files;
        }

        private EnumerateModels(folderId: string): JQueryPromise<OneDriveFile[]> {
            return this.oneDrive.EnumerateFiles(folderId).then(OneDriveRepository.UpdateNames);
        }

        /// If folder is missing and createIfNotFound is false, returns null.
        private UseBmaModelFolder(createIfNotFound: boolean): JQueryPromise<string> {
            var d = $.Deferred();
            if (this.modelfolderId) {
                d.resolve(this.modelfolderId);
            } else {
                var that = this;
                this.oneDrive.FindFolder(OneDriveRepository.bmaModelFolder)
                    .done(function (folderId: string) {
                        if (folderId) {
                            that.modelfolderId = folderId;
                            d.resolve(folderId);
                        } else {
                            console.log("BMA folder not found");
                            if (createIfNotFound) {
                                that.oneDrive.CreateFolder(OneDriveRepository.bmaModelFolder)
                                    .done(function (folderId) {
                                        that.modelfolderId = folderId;
                                        d.resolve(folderId);
                                    })
                                    .fail(function (err) {
                                        console.error("Failed to create a folder for BMA on the OneDrive: " + err);
                                        d.reject(err);
                                    });
                            }
                            else d.resolve(null); // folder not found
                        }
                    })
                    .fail(function (err) {
                        d.reject(err); // failed when tried to find the bma folder
                    });
            }
            return <JQueryPromise<string>>d.promise();
        }

        private UseBmaMotifFolder(createIfNotFound: boolean): JQueryPromise<string> {
            var d = $.Deferred();
            if (this.motiffolderId) {
                d.resolve(this.motiffolderId);
            } else {
                var that = this;
                this.oneDrive.FindFolder(OneDriveRepository.bmaMotifFolder)
                    .done(function (folderId: string) {
                        if (folderId) {
                            that.motiffolderId = folderId;
                            d.resolve(folderId);
                        } else {
                            console.log("BMA folder not found");
                            if (createIfNotFound) {
                                that.oneDrive.CreateFolder(OneDriveRepository.bmaMotifFolder)
                                    .done(function (folderId) {
                                        that.motiffolderId = folderId;
                                        d.resolve(folderId);
                                    })
                                    .fail(function (err) {
                                        console.error("Failed to create a folder for BMA on the OneDrive: " + err);
                                        d.reject(err);
                                    });
                            }
                            else d.resolve(null); // folder not found
                        }
                    })
                    .fail(function (err) {
                        d.reject(err); // failed when tried to find the bma folder
                    });
            }
            return <JQueryPromise<string>>d.promise();
        }

        public GetUserProfile(): JQueryPromise<OneDriveUserProfile> {
            return this.oneDrive.GetUserProfile();
        }

        /* IModelRepository implementation */

        public GetModelList(): JQueryPromise<BMA.UIDrivers.ModelInfo[]> {
            var that = this;
            var myModels = this.UseBmaModelFolder(false)
                .then<OneDriveFile[]>(function (folderId) {
                    if (folderId) {
                        return that.EnumerateModels(folderId);
                    } else { // no bma folder
                        var d = $.Deferred();
                        d.resolve(new Array<OneDriveFile>(0));
                        return d;
                    }
                });
            //var sharedModels = that.oneDrive.EnumerateSharedWithMeFiles()
            //    .then<SharedOneDriveFile[]>(function (files) {
            //        var jsonFiles = [];
            //        for (var i = 0; i < files.length; i++) {
            //            if (files[i]["file"]["mimeType"].indexOf("application/json") === 0) {
            //                jsonFiles.push(OneDriveRepository.UpdateName(files[i]));
            //            }
            //        }
            //        return jsonFiles;                  
            //    });
            return $.when(myModels/*, sharedModels*/)
                .then(function (myFiles: OneDriveFile[], sharedFiles: OneDriveFile[]) {
                    return myFiles; //.concat(sharedFiles);
                });
        }

        public GetMotifList(): JQueryPromise<BMA.UIDrivers.ModelInfo[]> {
            var that = this;
            var myModels = this.UseBmaMotifFolder(false)
                .then<OneDriveFile[]>(function (folderId) {
                    if (folderId) {
                        return that.EnumerateModels(folderId);
                    } else { // no bma folder
                        var d = $.Deferred();
                        d.resolve(new Array<OneDriveFile>(0));
                        return d;
                    }
                });
            //var sharedModels = that.oneDrive.EnumerateSharedWithMeFiles()
            //    .then<SharedOneDriveFile[]>(function (files) {
            //        var jsonFiles = [];
            //        for (var i = 0; i < files.length; i++) {
            //            if (files[i]["file"]["mimeType"].indexOf("application/json") === 0) {
            //                jsonFiles.push(OneDriveRepository.UpdateName(files[i]));
            //            }
            //        }
            //        return jsonFiles;                  
            //    });
            return $.when(myModels/*, sharedModels*/)
                .then(function (myFiles: OneDriveFile[], sharedFiles: OneDriveFile[]) {
                    return myFiles; //.concat(sharedFiles);
                });
        }

        public GetModelMotifList(): JQueryPromise<BMA.UIDrivers.TypedModelInfo[]> {
            var that = this;
            return $.when(that.GetModelList(), that.GetMotifList()).then(function (models, motifs) {
                var result = [];
                for (var i = 0; i < models.length; i++) {
                    var newModel = models[i];
                    newModel.type = BMA.UIDrivers.StorageContentType.Model;
                    result.push(newModel);
                }
                for (var i = 0; i < motifs.length; i++) {
                    var newMotif = motifs[i];
                    newMotif.type = BMA.UIDrivers.StorageContentType.Motif;
                    result.push(newMotif);
                }
                return result;
            });
        }

        public IsInRepo(fileId: string): JQueryPromise<boolean> {
            return this.oneDrive.FileExists(fileId);
        }

        public LoadModel(fileId: string): JQueryPromise<JSON> {
            return this.oneDrive.LoadFile(fileId);
        }

        public LoadMotif(fileId: string): JQueryPromise<JSON> {
            return this.oneDrive.LoadFile(fileId);
        }

        /// Saves model to the BMA folder using `modelName` plus extension ".json" as file name.
        /// Creates the BMA folder, unless it exists.
        /// Returns information about the saved file.
        public SaveModel(modelName: string, modelContent: JSON): JQueryPromise<BMA.UIDrivers.ModelInfo> {
            var that = this;
            return this.UseBmaModelFolder(true)
                .then<OneDriveFile>(function (folderId: string) {
                    return that.oneDrive.SaveFile(folderId, modelName + ".json", modelContent).then(OneDriveRepository.UpdateName);
                });
        }

        public SaveMotif(motifName: string, motifContent: JSON): JQueryPromise<BMA.UIDrivers.ModelInfo> {
            var that = this;
            return this.UseBmaMotifFolder(true)
                .then<OneDriveFile>(function (folderId: string) {
                    return that.oneDrive.SaveFile(folderId, motifName + ".json", motifContent).then(OneDriveRepository.UpdateName);
                });
        }

        public RemoveModel(fileId: string): JQueryPromise<boolean> {
            return this.oneDrive.RemoveFile(fileId);
        }

        public RemoveMotif(fileId: string): JQueryPromise<boolean> {
            return this.oneDrive.RemoveFile(fileId);
        }
    }
}
