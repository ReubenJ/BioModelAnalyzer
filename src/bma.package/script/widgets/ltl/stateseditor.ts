// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

(function ($) {
    $.widget("BMA.stateseditor", {
        _stateToolbar: null,
        _stateButtons: null,
        _addStateButton: null,
        _toolbar: null,
        _keyframes: null,
        _description: null,
        _ltlStates: null,
        _ltlAddFormulaButton: null,
        _activeState: null,

        options: {
            variables: [],
            states: [],
            minConst: 0,
            maxConst: 100,
            commands: undefined,
            onStatesUpdated: undefined,
            onComboBoxOpen: undefined,
        },

        _create: function () {
            var that = this;

            this._stateToolbar = $("<div></div>").addClass("state-toolbar").appendTo(this.element);
            this._stateButtons = $("<div></div>").addClass("state-buttons").appendTo(this._stateToolbar);
            that.addContextMenu();

            that._initStates();

            this._addStateButton = $("<div>+</div>").addClass("state-button").addClass("new").appendTo(this._stateButtons).click(function () {
                that.addState();
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateAdded" });
            });

            this._description = $("<input></input>").attr("type", "text").addClass("state-description").attr("size", "15").attr("data-row-type", "description")
                .attr("placeholder", "Description").appendTo(this.element);
            this._description.bind("input change", function () {
                var idx = that.options.states.indexOf(that._activeState);
                that.options.states[idx].description = this.value;
                that._activeState.description = this.value;

                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });

            this._ltlStates = $("<div></div>").addClass("LTL-state").appendTo(this.element);

            var table = $("<table></table>").addClass("state-condition").attr("data-row-type", "add").appendTo(this._ltlStates);
            var tbody = $("<tbody></tbody>").appendTo(table);
            var tr = $("<tr></tr>").appendTo(tbody);

            this._ltlAddFormulaButton = $("<td>+</td>").addClass("LTL-line-new").appendTo(tr).click(function () {
                that.addFormula();

                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });
        },

        _initStates: function () {
            var that = this;
            for (var i = this.options.states.length - 1; i >= 0; i--) {
                var stateButton = $("<div>" + this.options.states[i].name + "</div>").attr("data-state-name", this.options.states[i].name)
                    .addClass("state-button").addClass("state").prependTo(this._stateButtons).click(function () {
                        that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                        for (var j = 0; j < that.options.states.length; j++) {
                            if (that.options.states[j].name == $(this).attr("data-state-name")) {
                                that._activeState = that.options.states[j];
                                break;
                            }
                        }
                        that.refresh();
                    });
                this.addStatesHighlighting(stateButton);
            }
        },

        addStatesHighlighting: function (stateButton) {
            var that = this;

            stateButton.hover(function (e) {
                var variablesIds = [];
                var stateIdx;
                for (var j = 0; j < that.options.states.length; j++) {
                    if (that.options.states[j].name == $(this).attr("data-state-name")) {
                        stateIdx = j;
                        break;
                    }
                }
                if (stateIdx !== undefined) {
                    var formulas = that.options.states[stateIdx].formula;
                    for (var i = 0; i < formulas.length; i++) {
                        var variableId = formulas[i] && formulas[i][0] && formulas[i][0].value && formulas[i][0].value.variable !== undefined ?
                            formulas[i][0].value.variable : undefined;
                        if (variableId !== undefined)
                            variablesIds.push(variableId);
                    }

                    window.Commands.Execute("HighlightContent", {
                        variableHighlightIds: variablesIds,
                        containerHighlightIds: [],
                    });
                }
            }, (e) => {
                window.Commands.Execute("UnhighlightContent", undefined);
            });
        },

        addContextMenu: function () {
            var that = this;

            this._stateButtons.contextmenu({
                delegate: ".state",
                autoFocus: true,
                preventContextMenuForPopup: true,
                preventSelect: true,
                menu: [{ title: "Delete", cmd: "DeleteState", uiIcon: "ui-icon-trash" }],
                beforeOpen: function (event, ui) {
                    ui.menu.zIndex(50);
                    
                },
                select: function (event, ui) {
                    var args: any = {};
                    args.command = ui.cmd;
                    var state = ui.target.context;
                    args.stateName = $(state).attr("data-state-name");
                    for (var j = 0; j < that.options.states.length; j++) {
                        if (that.options.states[j].name == $(state).attr("data-state-name")) {
                            args.stateIdx = j;
                            break;
                        }
                    }
                    that.onContextMenuItemSelected(args);
                }
            });
        },

        addState: function (state = null) {
            var that = this;
            var stateName;
            var idx;
            if (state == null) {
                var k = this.options.states.length;
                idx = k;
                var lastStateName = "";
                for (var i = 0; i < k; i++) {
                    var lastStateIdx = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;
                    var stateIdx = this.options.states[i].name.length > 1 ? parseFloat(this.options.states[i].name.slice(1)) : 0;

                    if (stateIdx >= lastStateIdx) {
                        lastStateName = (lastStateName && stateIdx == lastStateIdx
                            && lastStateName.charAt(0) > this.options.states[i].name.charAt(0)) ?
                            lastStateName : this.options.states[i].name;
                    }
                }

                var charCode = lastStateName ? lastStateName.charCodeAt(0) : 65;
                var n = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;

                if (charCode >= 90) {
                    n++;
                    charCode = 65;
                } else if (lastStateName) charCode++;

                stateName = n ? String.fromCharCode(charCode) + n : String.fromCharCode(charCode);

                var newState = {
                    name: stateName,
                    description: "",
                    formula: [
                        [
                            undefined,
                            undefined,
                            undefined
                        ],
                    ]
                };

                this.options.states.push(newState);
            } else {
                stateName = state.name;
                idx = this.options.states.indexOf(state);
            }

            var state = <any>($("<div>" + stateName + "</div>").attr("data-state-name", stateName).addClass("state-button").addClass("state").click(function () {
                that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                for (var j = 0; j < that.options.states.length; j++) {
                    if (that.options.states[j].name == $(this).attr("data-state-name")) {
                        that._activeState = that.options.states[j];
                        break;
                    }
                }
                that.refresh();
            }));
            this.addStatesHighlighting(state);

            if (this._activeState != null)
                that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
            this._activeState = this.options.states[idx];
            state.insertBefore(this._stateButtons.children().last());
            
            this.refresh();
        },

        onContextMenuItemSelected: function (args) {
            var that = this;

            if (that.options.states[args.stateIdx] == that._activeState) {
                that._activeState = (args.stateIdx == that.options.states.length - 1) ? that.options.states[args.stateIdx - 1] :
                    that.options.states[args.stateIdx + 1];
            }

            that.options.states.splice(args.stateIdx, 1);
            that._stateButtons.find("[data-state-name='" + args.stateName + "']").remove();
            if (that.options.states.length == 0) {
                that.addState();
            } else that.refresh();

            that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
        },

        addFormula: function (formula = null) {
            var that = this;

            var stateIdx = that.options.states.indexOf(that._activeState);
            var formulaIdx = that.options.states[stateIdx].formula.indexOf(formula);

            if (formula == null) {
                that.options.states[stateIdx].formula.push(formula);
                formulaIdx = that.options.states[stateIdx].formula.length - 1;
            } 

            formula = formula && formula[0] && formula[1] && formula[2] ? formula : [
                {
                    type: "variable", value: formula && formula[0] && formula[0].value ? formula[0].value : {
                        container: undefined,
                        variable: undefined
                    },
                },
                { type: "operator", value: formula && formula[1] && formula[1].value ? formula[1].value : "=" },
                { type: "const", value: formula && formula[2] && formula[2].value ? formula[2].value : 0 },
            ];

            if (formula.length == 5) {
                var secondEq = [
                    {
                        type: "variable", value: formula[2] && formula[2].value ? formula[2].value : {
                            container: undefined,
                            variable: undefined
                        },
                    },
                    { type: "operator", value: formula[3] && formula[3].value ? formula[3].value : "<" },
                    { type: "const", value: formula[4] && formula[4].value ? formula[4].value : 0 },
                ];
                that.options.states[stateIdx].formula.splice(formulaIdx + 1, 0, secondEq);

                switch (formula[1].value) {
                    case ">":
                        formula[1].value = "<";
                    case "<":
                        formula[1].value = ">";
                    case ">=":
                        formula[1].value = "<=";
                    case "<=":
                        formula[1].value = ">=";
                    default: break;
                }

                formula = [
                    {
                        type: "variable", value: formula[2] && formula[2].value ? formula[2].value : {
                            container: undefined,
                            variable: undefined
                        },
                    },
                    { type: "operator", value: formula[1] && formula[1].value ? formula[1].value : ">" },
                    { type: "const", value: formula[0] && formula[0].value ? formula[0].value : 0 },
                ];
            } 

            that.options.states[stateIdx].formula[formulaIdx] = formula;

            var table = $("<table></table>").addClass("state-condition").attr("data-row-type", "formula");
            var tbody = $("<tbody></tbody>").appendTo(table);
            var tr = $("<tr></tr>").appendTo(tbody);
            
            var variableTd = $("<td></td>").addClass("variable").appendTo(tr);
            that.createVariablePicker(variableTd, formula[0]);

            variableTd.hover(function (e) {
                var variableId = parseFloat(formula[0].value.variable);
                window.Commands.Execute("HighlightContent", {
                    variableHighlightIds: [variableId],
                    containerHighlightIds: [],
                });
            }, (e) => {
                window.Commands.Execute("UnhighlightContent", undefined);
            });
           

            var operatorTd = $("<td></td>").addClass("operator").appendTo(tr);
            that.createOperatorPicker(operatorTd, formula[1], { variable: formula[0], stateIdx: stateIdx, formulaIdx: formulaIdx });


            var constTd = $("<td></td>").addClass("const").appendTo(tr);
            var constInput = $("<input></input>").addClass("number-input").attr("type", "text").attr("value", formula[2] ? formula[2].value : 0).appendTo(constTd);
            constInput.bind("input change", function () {
                if (parseFloat(this.value) > that.options.maxConst) this.value = that.options.maxConst;
                if (parseFloat(this.value) < that.options.minConst) this.value = that.options.minConst;
                formula[2].value = this.value;

                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });

            var removeTd = $("<td></td>").addClass("LTL-line-del").appendTo(tr).click(function () {
                var stateIndex = that.options.states.indexOf(that._activeState);
                var tableIndex = table.index();
                that.options.states[stateIndex].formula.splice(tableIndex, 1);
                $(table).remove();

                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });

            var removeIcon = $("<img>").attr("src", "../images/state-line-del.svg").appendTo(removeTd);
            
            table.insertBefore(this._ltlStates.children().last());
        },

        createOperatorPicker: function (operatorTd, operatorValue, forRangeOp) {
            var that = this;

            var firstLeft = $(operatorTd).offset().left;
            var firstTop = $(operatorTd).offset().top + 47;

            var operatorImg = $("<img>").appendTo(operatorTd);
            var operatorExpandButton = $("<div></div>").addClass('arrow-down').appendTo(operatorTd);
            var operatorSelector = undefined;

            var setOperatorValue = function (value) {
                switch (value) {
                    case ">":
                        operatorImg.attr("src", "images/ltlimgs/mo.png");
                        break;
                    case ">=":
                        operatorImg.attr("src", "images/ltlimgs/moeq.png");
                        break;
                    case "<":
                        operatorImg.attr("src", "images/ltlimgs/le.png");
                        break;
                    case "<=":
                        operatorImg.attr("src", "images/ltlimgs/leeq.png");
                        break;
                    case "=":
                        operatorImg.attr("src", "images/ltlimgs/eq.png");
                        break;
                    case "!=":
                        operatorImg.attr("src", "images/ltlimgs/noeq.png");
                        break;
                    case "<>":
                        value = ">";
                        operatorValue.value = value;
                        operatorImg.attr("src", "images/ltlimgs/mo.png");
                        var secondEq = [
                            {
                                type: "variable", value: forRangeOp.variable && forRangeOp.variable.value ? forRangeOp.variable.value : {
                                    container: undefined,
                                    variable: undefined
                                },
                            },
                            { type: "operator", value: "<" },
                            { type: "const", value: 0 },
                        ];
                        that.options.states[forRangeOp.stateIdx].formula.splice(forRangeOp.formulaIdx + 1, 0, secondEq);
                        that.refresh();
                        break;
                    default: break;
                }
                operatorValue.value = value;
                if (operatorSelector) {
                    operatorSelector.remove();
                    operatorSelector = undefined;
                }
            }

            setOperatorValue(operatorValue.value);

            $(document).mousedown(function (e) {
                if (operatorSelector) {
                    if (!operatorSelector.is(e.target) && operatorSelector.has(e.target).length === 0) {
                        operatorSelector.remove();
                    }
                }
            });

            operatorExpandButton.bind("click", function () {
                if (!operatorSelector) {
                    firstLeft = $(operatorTd).offset().left;
                    firstTop = $(operatorTd).offset().top + 47;

                    operatorSelector = that.updateOperatorPicker({ top: firstTop, left: firstLeft }, setOperatorValue);
                } else {
                    operatorSelector.remove();
                    operatorSelector = undefined;
                }
            });
        },

        updateOperatorPicker: function (position, setOperatorValue) {
            var that = this;
            var operatorSelector = $("<div></div>").addClass("operator-picker").appendTo('body');
            operatorSelector.offset({ top: position.top, left: position.left });

            var greDiv = $("<div></div>").attr("data-operator-type", ">").appendTo(operatorSelector);
            var gre = $("<img>").attr("src", "images/ltlimgs/mo.png").appendTo(greDiv);

            var greqDiv = $("<div></div>").attr("data-operator-type", ">=").appendTo(operatorSelector);
            var greq = $("<img>").attr("src", "images/ltlimgs/moeq.png").appendTo(greqDiv);

            var lesDiv = $("<div></div>").attr("data-operator-type", "<").appendTo(operatorSelector);
            var les = $("<img>").attr("src", "images/ltlimgs/le.png").appendTo(lesDiv);

            var lesqDiv = $("<div></div>").attr("data-operator-type", "<=").appendTo(operatorSelector);
            var lesq = $("<img>").attr("src", "images/ltlimgs/leeq.png").appendTo(lesqDiv);

            var equDiv = $("<div></div>").attr("data-operator-type", "=").appendTo(operatorSelector);
            var equ = $("<img>").attr("src", "images/ltlimgs/eq.png").appendTo(equDiv);

            var noequDiv = $("<div></div>").attr("data-operator-type", "!=").appendTo(operatorSelector);
            var noequ = $("<img>").attr("src", "images/ltlimgs/noeq.png").appendTo(noequDiv);

            var rangeDiv = $("<div></div>").attr("data-operator-type", "<>").appendTo(operatorSelector)
            var range = $("<img>").attr("src", "images/range.png").appendTo(rangeDiv);

            operatorSelector.children().bind("click", function () {
                var newOperator = $(this).attr("data-operator-type");
                setOperatorValue(newOperator);

                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            });

            return operatorSelector;
        },

        createVariablePicker: function (variableTd, variable) {
            var that = this;

            var containerImg = $("<div></div>").addClass("state-container-image").addClass("hidden").appendTo(variableTd);
            var selectedContainer = $("<div></div>").addClass("hidden").addClass("state-container-name").addClass("state-text").appendTo(variableTd);

            var variableImg = $("<div></div>").addClass("state-variable-image").appendTo(variableTd);
            var selectedVariable = $("<div></div>").addClass("only-variable").addClass("state-text").appendTo(variableTd);
            var expandButton = $("<div></div>").addClass('arrow-down').appendTo(variableTd);

            var firstLeft = $(variableTd).offset().left;
            var firstTop = $(variableTd).offset().top + 47;

           
            var setSelectedValue = function (value) {

                if (value.container === undefined) {
                    value.container = that.findContainer(value.variable);
                }

                var containerName;
                var variableName = undefined;
                for (var i = 0; i < that.options.variables.length; i++) 
                    if (that.options.variables[i].id == value.container) {
                        containerName = that.options.variables[i].name;
                        for (var j = 0; j < that.options.variables[i].vars.length; j++) {
                            if (that.options.variables[i].vars[j].id == value.variable) {
                                variableName = that.options.variables[i].vars[j].name;
                                break;
                            }
                        }
                        break;
                    }
                
                if (!containerName) {
                    value.container = 0;
                    containerName = "ALL";
                    if (!variableName) {
                        for (var j = 0; j < that.options.variables[0].vars.length; j++) {
                            if (that.options.variables[0].vars[j].id == value.variable) {
                                variableName = that.options.variables[0].vars[j].name;
                                break;
                            }
                        }
                    }
                }

                if (variableName === "") {
                    variableName = "Unnamed";
                } 
                
                $(selectedContainer).text(containerName);
                $(selectedVariable).text(variableName);
                selectedVariable.removeClass("not-selected");

                if (variablePicker) {
                    variablePicker.remove();
                    variablePicker = undefined;
                }
                
                if (containerName !== "ALL") {
                    containerImg.removeClass("hidden");
                    selectedContainer.removeClass("hidden");
                    selectedVariable.removeClass("only-variable");
                } else {
                    containerImg.addClass("hidden");
                    selectedContainer.addClass("hidden");
                    selectedVariable.addClass("only-variable");
                }
            }

            if (!$(selectedVariable).text())
                selectedVariable.addClass("not-selected");

            var variablePicker = undefined;
            setSelectedValue(variable.value);

            $(document).mousedown(function (e) {
                if (variablePicker) {
                    if (/*!variableTd.is(e.target) && variableTd.has(e.target).length === 0*/
                        !variablePicker.is(e.target) && variablePicker.has(e.target).length === 0) {
                        variablePicker.remove();
                    }
                }
            });

            expandButton.bind("click", function () {
                if (!variablePicker) {

                    firstLeft = $(variableTd).offset().left;
                    firstTop = $(variableTd).offset().top + 47;

                    that.executeonComboBoxOpen();
                    variablePicker = that.updateVariablePicker({ top: firstTop, left: firstLeft }, setSelectedValue, variable);
                } else {
                    variablePicker.remove();
                    variablePicker = undefined;
                }
            });
        },
        
        updateVariablePicker: function (position, setSelectedValue, currSymbol) {
            var that = this;

            var variablePicker = $("<div></div>").addClass("variable-picker").appendTo('body');
            variablePicker.offset({ top: position.top, left: position.left });
            var table = $("<table></table>").appendTo(variablePicker);
            var tbody = $("<tbody></tbody>").appendTo(table);

            var tr = $("<tr></tr>").appendTo(tbody);
            var tdContainer = $("<td></td>").appendTo(tr);
            var imgContainer = $("<div></div>").addClass("container-image")/*attr("src", "../images/container.svg")*/.appendTo(tdContainer);
            var tdVariable = $("<td></td>").appendTo(tr);
            var imgVariable = $("<div></div>").addClass("variable-image")/*attr("src", "../images/variable.svg")*/.appendTo(tdVariable);

            var trList = $("<tr></tr>").appendTo(tbody);



            var tdContainersList = $("<td></td>").addClass("container list").appendTo(trList);
            var divContainers = $("<div></div>").addClass("scrollable").appendTo(tdContainersList);
            var tdVariablesList = $("<td></td>").addClass("variable list").appendTo(trList);
            var divVariables = $("<div></div>").addClass("scrollable").appendTo(tdVariablesList);

            if (currSymbol.value.container === undefined) {
                currSymbol.value.container = that.findContainer(currSymbol.value.variable);
            }

            for (var i = 0; i < this.options.variables.length; i++) {
                var container = $("<a>" + this.options.variables[i].name + "</a>").attr("data-container-id", this.options.variables[i].id)
                    .appendTo(divContainers).click(function () {
                        that.setActiveContainer(divContainers, divVariables, this, setSelectedValue, currSymbol);
                    });

                container.hover(function (e) {
                    var containerId = parseFloat($(this).attr("data-container-id"));
                    if (containerId > 0) {
                        window.Commands.Execute("HighlightContent", { variableHighlightIds: [], containerHighlightIds: [containerId] });
                    }
                }, (e) => {
                    window.Commands.Execute("UnhighlightContent", undefined);
                });


                if (currSymbol.value != 0 && currSymbol.value.container == this.options.variables[i].id) {
                    that.setActiveContainer(divContainers, divVariables, container, setSelectedValue, currSymbol);
                }
            }
            if (currSymbol.value == 0) {
                that.setActiveContainer(divContainers, divVariables, divContainers.children().eq(0), setSelectedValue, currSymbol);
            }

            return variablePicker;
        },

        setActiveContainer: function (divContainers, divVariables, container, setSelectedValue, currSymbol) {
            var that = this;

            divContainers.find(".active").removeClass("active");
            divVariables.children().remove();

            var id = $(container).attr("data-container-id");
            var idx = 0;
            for (var i = 0; i < that.options.variables.length; i++)
                if (that.options.variables[i].id == id) {
                    idx = i;
                    break;
                }

            $(container).addClass("active");

            for (var j = 0; j < that.options.variables[idx].vars.length; j++) {

                var variableName = that.options.variables[idx].vars[j].name;
                variableName = variableName ? variableName : "Unnamed";
                if (that.options.variables[idx].vars[j].id !== undefined) {
                    
                    var variable = $("<a>" + variableName + "</a>").attr("data-variable-id", that.options.variables[idx].vars[j].id)
                        .appendTo(divVariables).click(function () {
                            divVariables.find(".active").removeClass("active");
                            $(this).addClass("active");

                            var containerId = parseFloat($(container).attr("data-container-id"));
                            var variablesId = parseFloat($(this).attr("data-variable-id"));
                            if (containerId == 0)
                                containerId = that.findContainer(variablesId);

                            currSymbol.value = { container: containerId, variable: variablesId };
                            setSelectedValue({ container: currSymbol.value.container, variable: currSymbol.value.variable });

                            that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
                        });

                    variable.hover(function(e) {
                        window.Commands.Execute("HighlightContent", { variableHighlightIds: [parseFloat($(this).attr("data-variable-id"))], containerHighlightIds: [] });
                    }, (e) => {
                        window.Commands.Execute("UnhighlightContent", undefined);
                    });

                    if (currSymbol.value != 0 && currSymbol.value.container == $(container).attr("data-container-id")
                        && currSymbol.value.variable == that.options.variables[idx].vars[j].id) {
                        variable.addClass("active");
                        setSelectedValue({ container: parseFloat($(container).attr("data-container-id")), variable: that.options.variables[idx].vars[j].id });
                    }
                }
            }
        },

        findContainer: function (variable) {
            var that = this;
            var container = 0;
            for (var i = 1; i < this.options.variables.length; i++) {
                for (var j = 0; j < this.options.variables[i].vars.length; j++) {
                    if (this.options.variables[i].vars[j].id == variable) {
                        container = that.options.variables[i].id;
                        break;
                    }
                }
            }
            return container;
        },

        isInsideVariableField: function (location) {
            var that = this;
            var statesPosition = $(this._ltlStates).offset();
            var statesWidth = $(this._ltlStates).width();
            var statesHeight = $(this._ltlStates).height();
            if (!(location.x > statesPosition.left && location.x < statesPosition.left + statesWidth
                && location.y > statesPosition.top && location.y < statesPosition.top + statesHeight))
                return -1;
            var states = $(this._ltlStates).find("[data-row-type='formula']");
            for (var i = 0; i < states.length; i++) {
                var formulaPosition = $(states[i]).offset();
                var formulaWidth = $(states[i]).find(".variable").width();
                var formulaHeight = $(states[i]).height();
                if ((location.x > formulaPosition.left && location.x < formulaPosition.left + formulaWidth
                    && location.y > formulaPosition.top && location.y < formulaPosition.top + formulaHeight))
                    return i;
            }

            var plusBtn = $(this._ltlStates).children().last();
            var plusBtnPosition = plusBtn.offset();
            var plusBtnWidth = plusBtn.width();
            var plusBtnHeight = plusBtn.height();
            if ((location.x > plusBtnPosition.left && location.x < plusBtnPosition.left + plusBtnWidth
                && location.y > plusBtnPosition.top && location.y < plusBtnPosition.top + plusBtnHeight))
                return states.length;

            return -1;
        },

        checkDroppedItem: function (itemParams) {
            var that = this;
            var idx = that.isInsideVariableField(itemParams.screenLocation);
            if (idx > -1) {
                var stateIdx = that.options.states.indexOf(that._activeState);

                if (that.options.states[stateIdx].formula.length == idx) 
                    that.addFormula();

                var value = itemParams.variable;
                var isVariableExist = false;
                for (var i = 0; i < that.options.variables.length; i++)
                    if (that.options.variables[i].id == value.container) {
                        isVariableExist = true;
                        break;
                    }

                if (!isVariableExist) {
                    value.container = 0;
                    for (var j = 0; j < that.options.variables[0].vars.length; j++)
                        if (that.options.variables[0].vars[j].id == value.variable) {
                            isVariableExist = true;
                            break;
                        }
                }

                if (isVariableExist) {
                    that.options.states[stateIdx].formula[idx][0] = { type: "variable", value: value };
                    that._activeState.formula[idx][0] = { type: "variable", value: value };

                that.refresh();
                that.executeStatesUpdate({ states: that.options.states, changeType: "stateModified" });
            }
                
            }
        },

        refresh: function () {
            var that = this;
            this._stateButtons.find("[data-state-name='" + this._activeState.name + "']").addClass("active");
            $(this._ltlStates).find("[data-row-type='formula']").remove();

            this._description.val(this._activeState.description);
            for (var i = 0; i < this._activeState.formula.length; i++) {
                this.addFormula(this._activeState.formula[i]);
            }
        },

        executeStatesUpdate: function (args) {
            if (this.options.onStatesUpdated !== undefined) {
                this.options.onStatesUpdated(args);
            }
        },

        executeonComboBoxOpen: function (args) {
            if (this.options.onComboBoxOpen !== undefined) {
                this.options.onComboBoxOpen();
            }
        },

        _setOption: function (key, value) {
            var that = this;
            this._super(key, value);

            switch (key) {
                case "variables": {
                    this.options.variables = [];
                    for (var i = 0; i < value.length; i++) {
                        this.options.variables.push(value[i]);
                    }
                    break;
                }
                case "states": {
                    this.options.states = [];
                    this._stateButtons.children(".state").remove();

                    for (var i = 0; i < value.length; i++) {
                        this.options.states.push(value[i]);
                        if (value[i].formula.length == 0)
                            value[i].formula.push([undefined, undefined, undefined, undefined, undefined]);
                    }
                    
                    if (this.options.states.length == 0) {
                        that.addState();
                    } else {
                        this._initStates();
                        if (this._activeState != null)
                            that._stateButtons.find("[data-state-name='" + that._activeState.name + "']").removeClass("active");
                        this._activeState = this.options.states[0];
                        this.refresh();
                    }
                    break;
                }
                default: break;
            }
        },
    });
} (jQuery));

interface JQuery {
    stateseditor(): JQuery;
    stateseditor(settings: Object): JQuery;
    stateseditor(optionLiteral: string, optionName: string): any;
    stateseditor(optionLiteral: string, optionName: string, optionValue: any): JQuery;
    stateseditor(methodName: string, methodValue: any): any;
} 
