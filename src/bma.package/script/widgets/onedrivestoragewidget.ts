// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.onedrivestoragewidget", {


        options: {
            items: [],
            motifs: [],
            activeShare: [],
            filterString: undefined,
            onelementselected: undefined,
        },

        _create: function () {
            var that = this;
            this.repo = this.element;
            var items = this.options.items;
            //this.repo = $('<div></div>')
            //    .addClass("localstorage-repo")
            //    //.addClass('localstorage-widget')
            //    .appendTo(this.element);   

            this.refresh();
        },

        refresh: function () {
            this._createHTML();
        },

        AddItem: function (item) {
            this.options.items.push(item);
            this.refresh();
        },

        createContextMenu: function () {
            var that = this;
            this.repo.contextmenu({
                delegate: "li .storage-source",
                autoFocus: true,
                preventContextMenuForPopup: true,
                preventSelect: true,
                menu: [
                    { title: "Move to local", cmd: "MoveToLocal" },
                    { title: "Copy to local", cmd: "CopyToLocal" },
                    //{
                    //    title: "Share", cmd: "Share"/*, children: [
                    //        { title: "BMA link", cmd: "BMALink" },
                    //        { title: "Web link", cmd: "WebLink" },
                    //        { title: "Email", cmd: "Email" },
                    //    ]*/
                    //},
                    //{ title: "Open BMA link", cmd: "OpenBMALink"},
                    //{ title: "Active Shares", cmd: "ActiveShares"},
                ],
                beforeOpen: function (event, ui) {
                    ui.menu.zIndex(50);
                    var idx = $(ui.target.context).index();
                    if (that.options.items[idx].shared) $(this).contextmenu("enableEntry", "MoveToLocal", false);
                    //if (that.options.activeShare.length === 0) $(this).contextmenu("showEntry", "ActiveShares", false);
                    //$(this).contextmenu("enableEntry", "Share", false);
                    //$(this).contextmenu("enableEntry", "OpenBMALink", false);
                },
                select: function (event, ui) {
                    var args: any = {};
                    var idx = $(ui.target.context).index();

                    if (ui.cmd == "Share") {
                        that.menuPopup("Share '" + $(ui.target.context).text() + "'", [
                            { name: "BMA link", callback: function () { console.log("bma link"); } },
                            { name: "Web link", callback: function () { console.log("web link"); } },
                            { name: "Email", callback: function () { console.log("email"); } }
                        ]);
                    } else if (ui.cmd == "OpenBMALink") {
                    } else if (ui.cmd == "ActiveShares") {
                    } else {
                        if (that.options.setoncopytolocal !== undefined) {
                            that.options.setoncopytolocal(that.options.items[idx]).done(function () {
                                if (ui.cmd == "MoveToLocal") {
                                    if (that.options.onremovemodel !== undefined)
                                        that.options.onremovemodel(that.options.items[idx].id);
                                }
                            });


                        }
                    }

                }
            });
        },

        _createHTML: function (items) {
            var that = this;

            var items = this.options.items;
            var motifs = this.options.motifs;
            var fs = that.options.filterString;

            this.repo.empty();

            this.loading = $("<div></div>").appendTo(this.repo);
            var anim = $("<div></div>").addClass("spinner").appendTo(that.loading);
            $("<div></div>").addClass("bounce1").appendTo(anim);
            $("<div></div>").addClass("bounce2").appendTo(anim);
            $("<div></div>").addClass("bounce3").appendTo(anim);

            var itemsToAdd = [];
            if (motifs !== undefined && motifs.length > 0) {
                for (var i = 0; i < motifs.length; i++) {
                    if (fs === undefined || fs === "" || motifs[i].name.toLowerCase().includes(fs.toLowerCase())) {
                        itemsToAdd.push({ item: motifs[i], source: "motifs" });
                    }
                }
            }
            if (items.length > 0) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].shared === undefined && (fs === undefined || fs === "" || items[i].name.toLowerCase().includes(fs.toLowerCase()))) {
                        itemsToAdd.push({ item: items[i], source: "storage" });
                    }
                }
            }

            this.ol = $('<ol></ol>').appendTo(this.repo);
            if (itemsToAdd.length > 0) {
                for (var i = 0; i < itemsToAdd.length; i++) {
                    var isStorage = itemsToAdd[i].source === "storage";

                    var li = $('<li></li>').appendTo(this.ol).click(function () {
                        var ind = $(this).index();

                        if (that.options.onelementselected != undefined) {
                            that.options.onelementselected(itemsToAdd[ind]);
                        }

                        that.repo.find(".ui-selected").removeClass("ui-selected");
                        that.ol.children().eq(ind).addClass("ui-selected");

                    });

                    //} 
                    //var a = $('<a></a>').addClass('delete').appendTo(li);
                    //if (items[i].shared) {
                    //    var ownerName = items[i].shared.owner && items[i].shared.owner.user && items[i].shared.owner.user.displayName ?
                    //        items[i].shared.owner.user.displayName : "Unknown";
                    //    var sharedIcon = $("<div>S</div>").addClass("share-icon").appendTo(li);
                    //    sharedIcon.tooltip({
                    //        //tooltipClass: "share-icon",
                    //        //position: {
                    //        //    at: "left-48px bottom",
                    //        //    collision: 'none',
                    //        //},
                    //        content: function () {
                    //            return ownerName;
                    //        },
                    //        show: null,
                    //        hide: false,
                    //        items: "div.share-icon",
                    //        close: function (event, ui) {
                    //            sharedIcon.data("ui-tooltip").liveRegion.children().remove();
                    //        },
                    //    });
                    //} else {

                    var cnt = $("<div></div>").css("display", "flex").css("flex-direction", "row").css("align-items", "center").appendTo(li);

                    if (isStorage) {
                        $("<div></div>").addClass("repo-model-icon").prependTo(cnt);
                        li.attr("data-source", "storage");
                        li.addClass("storage-source");
                    } else {
                        $("<div></div>").addClass("repo-motif-icon").prependTo(cnt);
                        li.attr("data-source", "motif");
                    }

                    var modelName = $("<div>" + itemsToAdd[i].item.name + "</div>").addClass("repo-model-name").appendTo(cnt);

                    var removeBtn = $('<button></button>').addClass("remove icon-delete").appendTo(li);// $('<img alt="" src="../images/icon-delete.svg">').appendTo(a);//
                    removeBtn.bind("click", function (event) {
                        event.stopPropagation();

                        var itemToAdd = itemsToAdd[$(this).parent().index()];
                        if (that.options.onremovemodel !== undefined)
                            that.options.onremovemodel(itemToAdd.item.id);
                    });
                }
            }

            if (this.options.loading) {
                this.loading.show();
                this.ol.hide();
            } else {
                this.loading.hide();
                this.ol.show();
            }


            //this.ol.selectable({
            //    start: function () {
            //    },
            //    stop: function () {
            //        var ind = that.repo.find(".ui-selected").index();
            //        if (that.options.onloadmodel !== undefined) {
            //            that.options.onloadmodel(items[ind].id);
            //            if (that.options.oncancelselection !== undefined)
            //                that.options.oncancelselection();
            //        }
            //        //window.Commands.Execute("LocalStorageLoadModel", "user." + items[ind]);
            //    }
            //});

            this.createContextMenu();
        },

        Message: function (msg) {
            if (this.onmessagechanged !== undefined)
                this.onmessagechanged(msg);
        },

        CancelSelection: function () {
            this.repo.find(".ui-selected").removeClass("ui-selected");
        },

        SetActiveModel: function (modelName) {
            var that = this;
            var idx;
            for (var i = 0; i < that.options.items.length; i++) {
                if (that.options.items[i].name == modelName) {
                    idx = i;
                    break;
                }
            }
            if (idx !== undefined) {
                this.repo.find(".ui-selected").removeClass("ui-selected");
                this.ol.children().eq(idx).addClass("ui-selected");
            }
        },

        menuPopup: function (title, listOfItems) { // list : { name, callback}
            var that = this;
            var content = $("<div></div>").addClass("repository-popup-menu");
            var list = $("<div></div>").appendTo(content);
            for (var i = 0; i < listOfItems.length; i++) {
                var elem = $("<div></div>").attr("data-menu-item-name", listOfItems[i].name).appendTo(list);
                var elemIcon = $("<div></div>").addClass("repository-menu-item").addClass("repository-menu-item-icon").appendTo(elem);
                if (!i) elemIcon.addClass("active");
                var elemName = $("<div>" + listOfItems[i].name + "</div>").addClass("repository-menu-item").appendTo(elem);
                elem.click(function () {
                    list.children().removeClass("active");
                    elemIcon.addClass("active");

                    var idx;
                    for (var j = 0; j < listOfItems.length; j++)
                        if ($(this).attr("data-menu-item-name") == listOfItems[j].name) {
                            idx = j;
                            break;
                        }

                    if (idx !== undefined && listOfItems[idx] !== undefined && listOfItems[idx].callback !== undefined) {
                        listOfItems[idx].callback(readOnlyBtn.hasClass("selected"));
                        content.empty();
                        popup.hide();
                    }
                });
            }

            var readOnlyBtn = $("<div>Read only</div>").addClass("repository-readonly-bttn").appendTo(content).click(function () {
                if (readOnlyBtn.hasClass("selected"))
                    readOnlyBtn.removeClass("selected");
                else readOnlyBtn.addClass("selected");
            });

            var popup = $("<div></div>").addClass('popup-window window').appendTo('body');
            popup.resultswindowviewer({ header: title, content: content, iconOn: false });
        },

        _setOption: function (key, value) {
            switch (key) {
                case "loading":
                    this.options.loading = value;
                    if (this.options.loading) {
                        this.loading.show();
                        this.ol.hide();
                    } else {
                        this.loading.hide();
                        this.ol.show();
                    }
                    break;
                case "items":
                    this.options.items = value;
                    this.refresh();
                    break;
                case "motifs":
                    this.options.motifs = value;
                    this.refresh();
                    break;
                case "onloadmodel":
                    this.options.onloadmodel = value;
                    break;
                case "onremovemodel":
                    this.options.onremovemodel = value;
                    break;
                case "setoncopytolocal":
                    this.options.setoncopytolocal = value;
                    break;
                case "onmessagechanged":
                    this.options.onmessagechanged = value;
                    break;
                case "oncancelselection":
                    this.options.oncancelselection = value;
                    break;
                case "filterString":
                    this.options.filterString = value;
                    this.refresh();
                    break;
            }
            this._super(key, value);
        },

        destroy: function () {
            this.element.empty();
        }

    });
}(jQuery));

interface JQuery {
    onedrivestoragewidget(): JQuery;
    onedrivestoragewidget(settings: Object): JQuery;
    onedrivestoragewidget(optionLiteral: string, optionName: string): any;
    onedrivestoragewidget(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}

