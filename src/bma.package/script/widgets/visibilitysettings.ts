// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.visibilitysettings", {

        _getList: function () {
            return this.list || this.element.find("ol,ul").eq(0);;
        },

        _create: function () {

            var that = this;
            this.list = this._getList();
            this.items = this.list.find("li");
            this.listOptions = [];


            this.items.each(function (ind) {

                var item = this;
                that.listOptions[ind] = {};
                var option = $(item).children(':first-child');
                that.listOptions[ind].name = option.text();
                var buttons = option.next();
                var children = buttons.children();
                children.each(function () {
                    var child = this;
                    var text = $(child).text();
                    var behavior = $(child).attr("data-behavior");

                    if (behavior !== undefined) {

                        var command, value = undefined;
                        try {
                            command = $(child).attr("data-command");
                        }
                        catch (ex) {
                            console.log("Error binding to command: " + ex);
                        }

                        switch (behavior) {
                            case "action":
                                $(this).bind('click', function () {
                                    window.Commands.Execute(command, {});
                                })
                                break;
                            case "toggle":
                                if (that.listOptions[ind].toggle === undefined) {
                                    value = command !== undefined ? ($(child).attr("data-default") === "true") : undefined;
                                    var button = $('<button></button>')
                                        .appendTo($(child));
                                    if (value) {
                                        button.parent().addClass("default-button onoff green");
                                        button.text("ON");
                                    }
                                    else {
                                        button.parent().addClass("default-button onoff grey");
                                        button.text("OFF");
                                    }

                                    that.listOptions[ind].toggle = value;
                                    that.listOptions[ind].toggleButton = button;
                                    if (command !== undefined) {
                                        button.parent().bind("click", function (e) {
                                            that.listOptions[ind].toggle = !that.listOptions[ind].toggle;
                                            window.Commands.Execute(command, that.listOptions[ind].toggle);
                                            that.changeButtonONOFFStyle(ind);
                                        });
                                    }
                                }
                                else
                                    console.log("Names of options should be different");
                                break;
                            case "multitoggle":
                                //var options = [];
                                //$(child).children().each(function (ei, elt) { options.push((<any>elt).text()); });
                                //$(child).empty();
                                $(child).css("display", "flex");
                                $(child).children().each(function (ei, elt) {
                                    var cmdarg = $(elt).attr("data-option");
                                    $(elt).click(function (args) {
                                        $(child).children().removeClass("green").addClass("grey");
                                        $(elt).removeClass("grey").addClass("green");
                                        window.Commands.Execute(command, cmdarg);
                                    });
                                });

                                break;

                            case "increment":
                                if (that.listOptions[ind].increment === undefined) {
                                    value = command !== undefined ? parseInt($(child).attr("data-default")) || 10 : undefined;
                                    $(this).addClass('pill-button-box');
                                    var plus = $('<button>+</button>').addClass("pill-button")
                                        .appendTo($(child))
                                        .addClass("hoverable");
                                    var minus = $('<button>-</button>').addClass("pill-button")
                                        .appendTo($(child))
                                        .addClass("hoverable");
                                    that.listOptions[ind].increment = value;
                                    plus.bind("click", function () {
                                        that.listOptions[ind].increment++;
                                        window.Commands.Execute(command, that.listOptions[ind].increment);
                                    })
                                    minus.bind("click", function () {
                                        if (that.listOptions[ind].increment > 1) {
                                            that.listOptions[ind].increment--;
                                            window.Commands.Execute(command, Math.max(1, that.listOptions[ind].increment));
                                        }
                                    })
                                }
                                break;
                        }
                    }
                })
            });
        },

        changeButtonONOFFStyle: function (ind) {
            var button = this.listOptions[ind].toggleButton;
            if (!this.listOptions[ind].toggle) {
                button.text("OFF");
                button.parent().removeClass("green").addClass("grey");
            }
            else {
                button.text("ON");
                button.parent().removeClass("grey").addClass("green");
            }
        },


        _setOption: function (key, value) {
            switch (key) {
                case "settingsState":
                    for (var i = 0; i < this.listOptions.length; i++) {
                        if (this.listOptions[i].name === value.name) {
                            this.listOptions[i].toggle = value.toggle;
                            this.changeButtonONOFFStyle(i);
                            this.listOptions[i].increment = value.increment;
                            return;
                        }
                        else console.log("No such option");
                    }
                    break;
            }
            $.Widget.prototype._setOption.apply(this, arguments);
            this._super("_setOption", key, value);
        },

        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }

    });
}(jQuery));

interface JQuery {
    visibilitysettings(): JQuery;
    visibilitysettings(settings: Object): JQuery;
    visibilitysettings(optionLiteral: string, optionName: string): any;
    visibilitysettings(optionLiteral: string, optionName: string, optionValue: any): JQuery;
}
