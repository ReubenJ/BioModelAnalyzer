// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
describe("ColoredTableViewer", () => {

    window.Commands = new BMA.CommandRegistry();
    var widget = $('<div></div>');


    afterEach(() => {
        widget.coloredtableviewer("destroy");
    })

    it("creates widget with options", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false];
        colorData[2] = [true, true, true];

        widget.coloredtableviewer({ header: header, numericData: numericData, colorData: colorData });
        var l = widget.find("tr").length
        expect(l).toEqual(numericData.length + 1);
        expect(widget.find("td").length).toEqual(12);
    })

    it("changes header option", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false];
        colorData[2] = [true, true, true];

        widget.coloredtableviewer({ header: header, numericData: numericData, colorData: colorData });

        header = [4, 5, 6];
        widget.coloredtableviewer({
            header: header
        });
        var headertd = widget.find("tr").eq(0).children("td");
        expect(headertd.each(function (ind, val) {
            header[ind].toString() === $(val).text();
        })).toBeTruthy();
    })

    it("changes numericData option", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];

        widget.coloredtableviewer({ header: header, numericData: numericData });


        numericData[0] = [4, 4, 4];
        numericData[1] = [5, 5, 5];
        numericData[2] = [6, 6, 6];

        widget.coloredtableviewer({
            numericData: numericData
        });

        var datatd0 = widget.find("tr").eq(1).children("td");
        expect(datatd0.each(function (ind, val) {
            numericData[0][ind].toString() === $(val).text();
        })).toBeTruthy();
    })

    it("creates proper table with colored background", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false];
        colorData[2] = [true, true, true];

        widget.coloredtableviewer({ header: header, numericData: numericData, colorData: colorData });
        var tr = widget.find("tr");
        for (var i = 0; i < header.length; i++) {
            expect(tr.eq(0).children().eq(i).text()).toEqual(header[i].toString());
        }
        for (var j = 0; j < numericData.length; j++) {
            for (var i = 0; i < numericData[j].length; i++) {
                var ij = tr.eq(j + 1).children().eq(i);
                expect(ij.text()).toEqual(numericData[j][i].toString());
                if (colorData[j][i])
                    expect(ij.hasClass('propagation-cell-green'));//css("background-color")).toEqual("rgb(204, 255, 153)");
                else
                    expect(ij.css("propagation-cell-red"));//.toEqual("rgb(255, 173, 173)");
            }
        }
    })


    it("doesn't create table when widget has only header", () => {
        var header = [1, 2, 3];
        widget.coloredtableviewer({ header: header });
        expect(widget.find("tr").length).toEqual(0);
    })

    //todo: as color tables were changed to canvas rendering, reconsider this test
    //it("creates widget only with colorData", () => {
    //    var colorData = [];
    //    colorData[0] = [true, false, true];
    //    colorData[1] = [false, false, false];
    //    colorData[2] = [true, true, true];
    //    widget.coloredtableviewer({ colorData: colorData, type: "color" });
    //    expect(widget.find("tr").length).toEqual(colorData.length);
    //    expect(widget.find("td").length).toEqual(colorData.length * 3);
    //})

    it("creates graph-min table", () => {
        var header = ["color", 1, 2, 3];
        var numericData = [];
        numericData[0] = ["rgb(255, 0, 0)", 1, 1, 1];
        numericData[1] = ["rgb(0, 128, 0)", 2, 2, 2];
        numericData[2] = ["rgb(0, 0, 255)", 3, 3, 3];
        widget.coloredtableviewer({ header: header, numericData: numericData, type: "graph-min" });
        
        var td1 = widget.find("tr");
        for (var i = 1; i < td1.length; i++) {
            expect(td1.eq(i).children().eq(0).css("background-color")).toEqual(numericData[i - 1][0]);
        }
    })

    it("creates graph-max table", () => {
        var header = ["Graph", "Name", "Range"];
        var numericData = [];
        numericData[0] = ["rgb(255, 0, 0)", "name1", 0, 1];
        numericData[1] = [undefined, "name2", 1, 5];
        numericData[2] = ["rgb(0, 0, 0)", "name3", 3, 6];

        widget.coloredtableviewer({ header: header, numericData: numericData, type: "graph-max" });

        var trs = widget.find("tr");
        var tds0 = trs.eq(0).children("td");
        for (var i = 0; i < tds0.length; i++) {
            expect(tds0.eq(i).text()).toEqual(header[i].toString());
        }
        var l = trs.length - 1;
        for (var i = 1; i < l; i++) {
            var tr = trs.eq(i);
            var tds = tr.children("td");
            if (numericData[i - 1][0] !== undefined)
                expect(tds.eq(0).css("background-color")).toEqual(numericData[i - 1][0]);
            else
                expect(tds.eq(0).css("background-color")).toEqual('');

            expect(tds.eq(1).hasClass("plot-check")).toEqual(numericData[i - 1][0] !== undefined);

            for (var j = 2; j < tds.length; j++) {
                expect(tds.eq(j).text()).toEqual(numericData[i - 1][j].toString());
            }

        }
    })

    it("creates graph-max table and clicks all button", () => {
        //spyOn(window.Commands, "Execute");

        var header = ["Graph", "Name", "Range"];
        var numericData = [];
        numericData[0] = ["rgb(255, 0, 0)",true, "name1", 0, 1];
        numericData[1] = [undefined,false, "name2", 1, 5];
        numericData[2] = ["rgb(0, 0, 0)", true, "name3", 3, 6];

        var callcount = 0;
        function changeVisibility(params) {
            callcount++;
            numericData[params.ind][1] = params.check;
        };

        widget.coloredtableviewer({ header: header, numericData: numericData, type: "graph-max" });
        widget.coloredtableviewer({
            "onChangePlotVariables": changeVisibility
        });
        
        var trs = widget.find("tr").not(":first-child").not(":last-child").find("td:eq(1)");
        var all = widget.coloredtableviewer("getAllButton");
        expect(all.hasClass("plot-check")).toBeTruthy();
        all.click();
        expect(all.hasClass("plot-check")).toBeTruthy();
        expect(trs.hasClass("plot-check")).toBeTruthy();
        expect(callcount).toEqual(1);
        all.click();
        expect(trs.hasClass("plot-check")).toBeFalsy();
        expect(callcount).toEqual(4);
    })


    it("creates graph-max table and clicks one button", () => {
        spyOn(window.Commands, "Execute");

        var header = ["Graph", "Name", "Range"];
        var numericData = [];
        numericData[0] = ["rgb(255, 0, 0)", "name1", 0, 1];
        numericData[1] = [undefined, "name2", 1, 5];
        numericData[2] = ["rgb(0, 0, 0)", "name3", 3, 6];
        
        var obj1 = jasmine.createSpyObj("obj1", ["changeVisibility"]);
        obj1.changeVisibility = function(params) {
            numericData[params.ind][1] = params.check;
        };

        spyOn(obj1, "changeVisibility");

        widget.coloredtableviewer({ header: header, numericData: numericData, type: "graph-max" });
        widget.coloredtableviewer({
            "onChangePlotVariables": obj1.changeVisibility
        });
        var buttons = widget.find("tr").not(":first-child").not(":last-child").find("td:eq(1)")
        
        buttons.eq(0).click();
        expect(buttons.eq(0).hasClass("plot-check")).toBeFalsy();
        expect(obj1.changeVisibility).toHaveBeenCalledWith({ ind: 0, check: false });
        buttons.eq(1).click();
        expect(buttons.eq(1).hasClass("plot-check")).toBeTruthy();
        expect(obj1.changeVisibility).toHaveBeenCalledWith({ ind: 1, check: true });
    })


    it("creates simulation-min table", () => {
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false];
        colorData[2] = [true, false, false];
        colorData[3] = [false, true, false];
        widget.coloredtableviewer({ type: "simulation-min", colorData: colorData });

        var trs = widget.find("tr");
        expect(trs.length).toEqual(colorData.length);
        for (var i = 0; i < trs.length; i++) {
            
            var tds = trs.eq(i).children("td");
            expect(tds.length).toEqual(colorData[i].length);

            for (var j = 0; j < tds.length; j++) {
                if (colorData[i][j]) {
                    expect(tds.eq(j).hasClass('change')).toBeTruthy();//.css("background-color")).toEqual("rgb(255, 247, 41)");
                }
            }
        }

    })

    /*
    it("creates widget with not compatible data sizes", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false];
        colorData[2] = [true, true, true];
        colorData[3] = [true, true, true];
        widget.coloredtableviewer({ header: header, numericData: numericData, colorData: colorData });
    })

    it("creates widget with not compatible data sizes-2", () => {
        var header = [1, 2, 3];
        var numericData = [];
        numericData[0] = [1, 1, 1];
        numericData[1] = [2, 2, 2];
        numericData[2] = [3, 3, 3];
        var colorData = [];
        colorData[0] = [true, false, true];
        colorData[1] = [false, false, false,false];
        colorData[2] = [true, true, true];
        widget.coloredtableviewer({ header: header, numericData: numericData, colorData: colorData });
    })
    */
})
