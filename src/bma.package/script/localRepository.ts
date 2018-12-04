// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
module BMA {
    export class LocalRepositoryTool implements BMA.UIDrivers.IModelRepository {
        
        private messagebox: BMA.UIDrivers.IMessageServiсe;

        constructor(messagebox: BMA.UIDrivers.IMessageServiсe) {
            this.messagebox = messagebox;
        }

        public IsInRepo(id: string) {
            return window.localStorage.getItem(id) !== null;
        }

        public Save(key: string, appModel: string) {
            try {
                window.localStorage.setItem(key, appModel);
                window.Commands.Execute("LocalStorageChanged", {});
            }
            catch (e) {
                if (e === 'QUOTA_EXCEEDED_ERR') {
                    this.messagebox.Show("Error: Local repository is full");
                }
            }
        }

        public ParseItem(item): boolean {
            try {
                var ml = JSON.parse(item);
                BMA.Model.ImportModelAndLayout(ml);
                return true;
            }
            catch(e) {
                return false;
            }
        }

        public SaveModel(id: string, model: JSON) {
            if (window.localStorage.getItem("user." + id) !== null) {
                if (confirm("Overwrite the file?"))
                    this.Save("user." + id, JSON.stringify(model));
            }
            else this.Save("user." + id, JSON.stringify(model));
        }

        public RemoveModel(id: string) {
            window.localStorage.removeItem(id);
            window.Commands.Execute("LocalStorageChanged", {});
        }

        public LoadModel(id: string): JQueryPromise<JSON> {
            var that = this;
            var deffered = $.Deferred();
            var model = window.localStorage.getItem(id);
            if (model !== null) {
                try {
                    var app = new BMA.Model.AppModel();
                    app.Deserialize(model);
                    deffered.resolve(JSON.parse(app.Serialize()));
                }
                catch (ex) { that.messagebox.Show(ex); deffered.reject(ex); }
            }
            else deffered.resolve(null);

            return <JQueryPromise<JSON>>deffered.promise();
        }

        public GetModelList(): JQueryPromise<string[]> {
            var deffered = $.Deferred();
            var keys:string[] = [];
            for (var i = 0; i < window.localStorage.length; i++) {
                var key = window.localStorage.key(i);
                var usrkey = this.IsUserKey(key);
                if (usrkey !== undefined) {
                    var item = window.localStorage.getItem(key);
                    if (this.ParseItem(item)) {
                        keys.push(usrkey);
                    }
                }
            }
            deffered.resolve(keys);

            var p = <JQueryPromise<string[]>>deffered.promise();
            return p;
        }

        public GetModels(): JQueryPromise<JSON[]> {
            var deffered = $.Deferred();
            var that = this;

            var models = [];
            for (var i = 0; i < window.localStorage.length; i++) {
                var key = window.localStorage.key(i);
                var usrkey = this.IsUserKey(key);
                if (usrkey !== undefined) {
                    var item = window.localStorage.getItem(key);
                    models.push(JSON.parse(item));
                }
            }
            deffered.resolve(models);

            var p = <JQueryPromise<JSON[]>>deffered.promise();
            return p;
        }

        private IsUserKey(key: string): string {
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
    }
}
