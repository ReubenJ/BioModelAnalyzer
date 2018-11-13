// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
module BMA {
    export module ModelHelper {
        //Renders svg from model or motif
        export function RenderSVG(svg: any, model: BMA.Model.BioModel, layout: BMA.Model.Layout, grid: any, args: any): any {
            //Generating svg elements from model and layout
            var svgElements = [];

            var translate = args === undefined ? undefined : args.translate;

            var containerLayouts = layout.Containers;
            for (var i = 0; i < containerLayouts.length; i++) {
                var containerLayout = containerLayouts[i];
                var element = window.ElementRegistry.GetElementByType("Container");

                var isHighlighted = undefined;
                if (args !== undefined && args.containerHighlightIds !== undefined) {
                    isHighlighted = false;
                    for (var j = 0; j < args.containerHighlightIds.length; j++) {
                        if (containerLayout.Id === args.containerHighlightIds[j]) {
                            isHighlighted = true;
                            break;
                        }
                    }
                }

                var isSelected = false;
                if (args !== undefined && args.selection !== undefined) {
                    isSelected = args.selection.cells[containerLayout.Id];
                }

                svgElements.push(element.RenderToSvg({
                    layout: containerLayout,
                    grid: grid,
                    background: args === undefined || args.containersStability === undefined ? undefined : GetContainerColorByStatus(args.containersStability[containerLayout.Id]),
                    isHighlighted: isHighlighted,
                    isSelected: isSelected,
                    translate: translate
                }));
            }

            var variables = model.Variables;
            var variableLayouts = layout.Variables;

            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var variableLayout = variableLayouts[i];
                var element = window.ElementRegistry.GetElementByType(variable.Type);
                var additionalInfo = args === undefined || args.variablesStability === undefined ? undefined : GetItemById(args.variablesStability, variable.Id);

                var isHighlighted = undefined;
                if (args !== undefined && args.variableHighlightIds !== undefined) {
                    isHighlighted = false;
                    for (var j = 0; j < args.variableHighlightIds.length; j++) {
                        if (variable.Id === args.variableHighlightIds[j]) {
                            isHighlighted = true;
                            break;
                        }
                    }
                    if (!isHighlighted) {
                        for (var j = 0; j < args.containerHighlightIds.length; j++) {
                            if (variable.ContainerId === args.containerHighlightIds[j]) {
                                isHighlighted = true;
                                break;
                            }
                        }
                    }
                }

                var isSelected = false;
                if (args !== undefined && args.selection !== undefined) {
                    isSelected = args.selection.variables[variable.Id];
                }

                var container: any = variable.Type === "MembraneReceptor" ? layout.GetContainerById(variable.ContainerId) : undefined;
                var sizeCoef = undefined;
                var gridCell = undefined;
                if (container !== undefined) {
                    sizeCoef = container.Size;
                    gridCell = { x: container.PositionX, y: container.PositionY };
                }
                svgElements.push(element.RenderToSvg({
                    model: variable,
                    layout: variableLayout,
                    grid: grid,
                    gridCell: gridCell,
                    sizeCoef: sizeCoef,
                    valueText: additionalInfo === undefined ? undefined : additionalInfo.range,
                    labelColor: additionalInfo === undefined ? undefined : GetVariableColorByStatus(additionalInfo.state),
                    isHighlighted: isHighlighted,
                    isSelected: isSelected,
                    translate: translate
                }));
            }

            var relationships = model.Relationships;
            for (var i = 0; i < relationships.length; i++) {
                var relationship = relationships[i];
                var element = window.ElementRegistry.GetElementByType(relationship.Type);

                var start = GetVariableById(layout, model, relationship.FromVariableId).layout;
                var end = GetVariableById(layout, model, relationship.ToVariableId).layout;

                var hasReverse = false;
                for (var j = 0; j < relationships.length; j++) {
                    var revRel = relationships[j];
                    if (revRel.Id !== relationship.Id && revRel.FromVariableId === relationship.ToVariableId && revRel.ToVariableId === relationship.FromVariableId) {
                        hasReverse = true;
                        break;
                    }
                }

                var isSelected = false;
                if (args !== undefined && args.selection !== undefined) {
                    isSelected = args.selection.relationships[relationship.Id];
                }

                svgElements.push(element.RenderToSvg({
                    layout: { start: start, end: end },
                    grid: grid,
                    id: relationship.Id,
                    hasReverse: hasReverse,
                    isSelected: isSelected,
                    translate: translate
                }));
            }


            //constructing final svg image
            svg.clear();
            var defs = svg.defs("bmaDefs");
            var activatorMarker = svg.marker(defs, "Activator", 4, 0, 8, 4, "auto", { viewBox: "0 -2 4 4" });
            svg.polyline(activatorMarker, [[0, 2], [4, 0], [0, -2]], { fill: "none", stroke: "#808080", strokeWidth: "1px" });
            var inhibitorMarker = svg.marker(defs, "Inhibitor", 0, 0, 2, 6, "auto", { viewBox: "0 -3 2 6" });
            svg.line(inhibitorMarker, 0, 3, 0, -3, { fill: "none", stroke: "#808080", strokeWidth: "2px" });

            for (var i = 0; i < svgElements.length; i++) {
                svg.add(svgElements[i]);
            }

            return svg.toSVG();
        }

        export function GetVariableColorByStatus(status): string {
            if (status)
                return "green";//"#D9FFB3";
            else
                return "red";
        }

        export function GetContainerColorByStatus(status): string {
            if (status)
                return "#E9FFCC";
            else
                return "#FFDDDB";
        }

        export function GetItemById(arr, id) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].id === id)
                    return arr[i];
            }

            return undefined;
        }

        export function GetVariableById(layout: BMA.Model.Layout, model: BMA.Model.BioModel, id: number): { model: BMA.Model.Variable; layout: BMA.Model.VariableLayout } {
            var variableLayouts = layout.Variables;
            var variables = model.Variables;
            for (var i = 0; i < variableLayouts.length; i++) {
                var variableLayout = variableLayouts[i];
                if (variableLayout.Id === id) {
                    return { model: variables[i], layout: variableLayout };
                }
            }

            throw "No such variable in model";
        }

        export function CreateClipboardContent(model: BMA.Model.BioModel, layout: BMA.Model.Layout, contextElement: { id: number; type: string }): {
            Container: BMA.Model.ContainerLayout;
            Variables: {
                m: BMA.Model.Variable;
                l: BMA.Model.VariableLayout
            }[];
            Realtionships: BMA.Model.Relationship[],
            isCopy: boolean;
        } {

            var result = undefined;

            if (contextElement.type === "variable") {
                var v = model.GetVariableById(contextElement.id);
                var l = layout.GetVariableById(contextElement.id);

                if (v !== undefined && l !== undefined) {
                    result = {
                        Container: undefined,
                        Realtionships: undefined,
                        Variables: [{ m: v, l: l }]
                    };
                }

            } else if (contextElement.type === "container") {
                var id = contextElement.id;
                var cnt = layout.GetContainerById(id);
                if (cnt !== undefined) {
                    var clipboardVariables = [];

                    var variables = model.Variables;
                    var variableLayouts = layout.Variables;

                    for (var i = 0; i < variables.length; i++) {
                        var variable = variables[i];
                        if (variable.ContainerId === id) {
                            clipboardVariables.push({ m: variable, l: variableLayouts[i] });
                        }
                    }

                    var clipboardRelationships = [];
                    var relationships = model.Relationships;

                    for (var i = 0; i < relationships.length; i++) {
                        var rel = relationships[i];
                        var index = 0;
                        for (var j = 0; j < clipboardVariables.length; j++) {
                            var cv = clipboardVariables[j];

                            if (rel.FromVariableId === cv.m.Id) {
                                index++;
                            }

                            if (rel.ToVariableId === cv.m.Id) {
                                index++;
                            }

                            if (index == 2)
                                break;
                        }

                        if (index === 2) {
                            clipboardRelationships.push(rel);
                        }
                    }

                    result = {
                        Container: cnt,
                        Realtionships: clipboardRelationships,
                        Variables: clipboardVariables
                    };
                }
            }

            return result;
        }

        export function GetGridCell(x: number, y: number, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): { x: number; y: number } {
            var cellX = Math.ceil((x - grid.xOrigin) / grid.xStep) - 1;
            var cellY = Math.ceil((y - grid.yOrigin) / grid.yStep) - 1;
            return { x: cellX, y: cellY };
        }

        //TODO: get rid of one of those methods
        export function GetGridCell2(x: number, y: number, grid: { x0: number; y0: number; xStep: number; yStep: number }): { x: number; y: number } {
            var cellX = Math.ceil((x - grid.x0) / grid.xStep) - 1;
            var cellY = Math.ceil((y - grid.y0) / grid.yStep) - 1;
            return { x: cellX, y: cellY };
        }

        /*
        * Retrun cells which will occupied by container after its resize to @containerSize
        */
        export function GetContainerExtraCells(container: BMA.Model.ContainerLayout, containerSize: number): { x: number; y: number }[] {
            var result = [];

            if (container !== undefined) {
                var currentSize = container.Size;
                if (containerSize > currentSize) {
                    var diff = containerSize - currentSize;
                    for (var i = 0; i < container.Size; i++) {
                        for (var j = 0; j < diff; j++) {
                            result.push({ x: container.PositionX + container.Size + j, y: container.PositionY + i });
                        }
                    }
                    for (var i = 0; i < diff; i++) {
                        for (var j = 0; j < containerSize; j++) {
                            result.push({ x: container.PositionX + j, y: container.PositionY + container.Size + i });
                        }
                    }
                }
            }

            return result;
        }

        export function IsGridCellEmpty(gridCell: { x: number; y: number }, model: BMA.Model.BioModel, layout: BMA.Model.Layout, id: number, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): boolean {
            var layouts = layout.Containers;
            for (var i = 0; i < layouts.length; i++) {
                if (layouts[i].Id === id)
                    continue;

                if (layouts[i].PositionX <= gridCell.x && layouts[i].PositionX + layouts[i].Size > gridCell.x &&
                    layouts[i].PositionY <= gridCell.y && layouts[i].PositionY + layouts[i].Size > gridCell.y) {
                    return false;
                }
            }

            var result = [];
            var variables = model.Variables;
            var variableLayouts = layout.Variables;
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var variableLayout = variableLayouts[i];

                if (variable.Type !== "Constant")
                    continue;

                var vGridCell = GetGridCell(variableLayout.PositionX, variableLayout.PositionY, grid);

                if (gridCell.x === vGridCell.x && gridCell.y === vGridCell.y) {
                    return false;
                }
            }

            return true;

        }

        //TODO: get rid of duplicant
        export function IsGridCellEmpty2(gridCell: { x: number; y: number }, model: BMA.Model.BioModel, layout: BMA.Model.Layout, id: number, grid: { x0: number; y0: number; xStep: number; yStep: number }): boolean {
            var layouts = layout.Containers;
            for (var i = 0; i < layouts.length; i++) {
                if (layouts[i].Id === id)
                    continue;

                if (layouts[i].PositionX <= gridCell.x && layouts[i].PositionX + layouts[i].Size > gridCell.x &&
                    layouts[i].PositionY <= gridCell.y && layouts[i].PositionY + layouts[i].Size > gridCell.y) {
                    return false;
                }
            }

            var result = [];
            var variables = model.Variables;
            var variableLayouts = layout.Variables;
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var variableLayout = variableLayouts[i];

                if (variable.Type !== "Constant")
                    continue;

                var vGridCell = GetGridCell2(variableLayout.PositionX, variableLayout.PositionY, grid);

                if (gridCell.x === vGridCell.x && gridCell.y === vGridCell.y) {
                    return false;
                }
            }

            return true;

        }

        //export function GetContainerFromGridCell(layout: BMA.Model.Layout, gridCell: { x: number; y: number }): BMA.Model.ContainerLayout {
        //    var layouts = layout.Containers;
        //    for (var i = 0; i < layouts.length; i++) {
        //        if (layouts[i].PositionX <= gridCell.x && layouts[i].PositionX + layouts[i].Size > gridCell.x &&
        //            layouts[i].PositionY <= gridCell.y && layouts[i].PositionY + layouts[i].Size > gridCell.y) {
        //            return layouts[i];
        //        }
        //    }

        //    return undefined;
        //}


        //export function GetConstantsFromGridCell(source: { model: BMA.Model.BioModel; layout: BMA.Model.Layout }, gridCell: { x: number; y: number }, grid: { x0: number; y0: number; xStep: number; yStep: number }): { container: BMA.Model.Variable; layout: BMA.Model.VariableLayout }[] {
        //    var result = [];
        //    var variables = source.model.Variables;
        //    var variableLayouts = source.layout.Variables;
        //    for (var i = 0; i < variables.length; i++) {
        //        var variable = variables[i];
        //        var variableLayout = variableLayouts[i];

        //        if (variable.Type !== "Constant")
        //            continue;

        //        var vGridCell = GetGridCell(variableLayout.PositionX, variableLayout.PositionY, { xOrigin: grid.x0, yOrigin: grid.y0, xStep: grid.xStep, yStep: grid.yStep });

        //        if (gridCell.x === vGridCell.x && gridCell.y === vGridCell.y) {
        //            result.push({ variable: variable, variableLayout: variableLayout });
        //        }
        //    }
        //    return result;
        //}

        ////Checks whether target cell is occupied or not in model
        //export function CheckIfTargetCellIsOccupied(model: { model: BMA.Model.BioModel; layout: BMA.Model.Layout }, targetCell: { x: number, y: number }, grid: { x0: number; y0: number; xStep: number; yStep: number }): boolean {
        //    return GetContainerFromGridCell(model.layout, targetCell) !== undefined || GetConstantsFromGridCell(model, targetCell, grid).length > 0;
        //}

        //Checks that fitTarget can be inserted into fitSource into target cell of fitSource without creation of an additional space
        export function CheckModelFit(
            fitSource: { model: BMA.Model.BioModel; layout: BMA.Model.Layout },
            fitTarget: { model: BMA.Model.BioModel; layout: BMA.Model.Layout },
            grid: { x0: number; y0: number; xStep: number; yStep: number },
            targetCell: { x: number; y: number }): boolean {

            var gridBBox = GetModelBoundingBox(fitTarget.layout, { xOrigin: grid.x0, yOrigin: grid.y0, xStep: grid.xStep, yStep: grid.yStep });
            var gridBBoxHorCells = gridBBox.width / grid.xStep;
            var gridBBoxVertCells = gridBBox.height / grid.yStep;

            if (gridBBoxHorCells > 1 || gridBBoxVertCells > 1) {
                //TODO: insert logic here
            }
            else return true;

            return false;
        }

        //Inserts target model into source model and returns merged result
        export function MergeModels(
            source: { model: BMA.Model.BioModel; layout: BMA.Model.Layout },
            target: { model: BMA.Model.BioModel; layout: BMA.Model.Layout },
            grid: { x0: number; y0: number; xStep: number; yStep: number },
            targetCell: { x: number; y: number },
            indexOffset: number): { result: { model: BMA.Model.BioModel; layout: BMA.Model.Layout }; indexOffset: number } {

            var model = source.model;
            var layout = source.layout;
            var idDic = {};
            var cntDic = {};
            var variables = model.Variables.slice(0);
            var variableLayouts = layout.Variables.slice(0);
            var containerLayouts = layout.Containers.slice(0);
            var relationships = model.Relationships.slice(0);
            var variableIndex = indexOffset;

            var gridBBox = GetModelBoundingBox(target.layout, { xOrigin: grid.x0, yOrigin: grid.y0, xStep: grid.xStep, yStep: grid.yStep });

            var gridBBoxHorCells = gridBBox.width / grid.xStep;
            var gridBBoxVertCells = gridBBox.height / grid.yStep;


            if (gridBBoxHorCells > 1 || gridBBoxVertCells > 1) {
                //Creating extra empty space inside model before insertion
                for (var i = 0; i < containerLayouts.length; i++) {
                    var cnt = containerLayouts[i];
                    var newCntX = cnt.PositionX;
                    var newCntY = cnt.PositionY;

                    if (cnt.PositionX >= targetCell.x && cnt.PositionY >= targetCell.y) {
                        if (cnt.PositionX > targetCell.x) {
                            newCntX += gridBBoxHorCells - 1;
                        }

                        if (cnt.PositionY > targetCell.y) {
                            newCntY += gridBBoxVertCells - 1;
                        }
                    }

                    containerLayouts[i] = new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, cnt.Size, newCntX, newCntY);
                }

                for (var i = 0; i < variableLayouts.length; i++) {
                    var variableLayout = variableLayouts[i];
                    var varPosX = variableLayout.PositionX;
                    var varPosY = variableLayout.PositionY;
                    var variableGridCell = GetGridCell(variableLayout.PositionX, variableLayout.PositionY, { xOrigin: grid.x0, yOrigin: grid.y0, xStep: grid.xStep, yStep: grid.yStep });

                    if (variableGridCell.x >= targetCell.x && variableGridCell.y >= targetCell.y) {
                        if (variableGridCell.x > targetCell.x) {
                            varPosX += (gridBBoxHorCells - 1) * grid.xStep;
                        }

                        if (variableGridCell.y > targetCell.y) {
                            varPosY += (gridBBoxVertCells - 1) * grid.yStep;
                        }
                    }

                    variableLayouts[i] = new BMA.Model.VariableLayout(variableLayout.Id, varPosX, varPosY, variableLayout.CellX, variableLayout.CellY, variableLayout.Angle, variableLayout.TFDescription);
                }
            }

            var targetOffsetX = - gridBBox.x + targetCell.x * grid.xStep + grid.x0;
            var targetOffsetY = - gridBBox.y + targetCell.y * grid.yStep + grid.y0;

            for (var i = 0; i < target.layout.Containers.length; i++) {
                var cnt = target.layout.Containers[i];
                var newContainerId = variableIndex++;
                cntDic[cnt.Id] = newContainerId;

                var newCntName = cnt.Name == undefined || cnt.Name == "" ? BMA.Model.GenerateNewContainerName(containerLayouts) : cnt.Name;

                var containerOffset = {
                    x: cnt.PositionX * grid.xStep + grid.x0 + targetOffsetX,
                    y: cnt.PositionY * grid.yStep + grid.y0 + targetOffsetY,
                };

                var cntX = containerOffset.x / grid.xStep;
                var cntY = containerOffset.y / grid.yStep;

                containerLayouts.push(new BMA.Model.ContainerLayout(newContainerId, newCntName, cnt.Size, cntX, cntY));
            }


            for (var i = 0; i < target.model.Variables.length; i++) {
                var variable = target.model.Variables[i];
                var variableLayout = target.layout.Variables[i];
                idDic[variable.Id] = variableIndex;
                var offsetX = variableLayout.PositionX + targetOffsetX;
                var offsetY = variableLayout.PositionY + targetOffsetY;
                variables.push(new BMA.Model.Variable(variableIndex, cntDic[variable.ContainerId], variable.Type, variable.Name, variable.RangeFrom, variable.RangeTo, variable.Formula));
                variableLayouts.push(new BMA.Model.VariableLayout(variableIndex++, offsetX, offsetY, 0, 0, variableLayout.Angle, variableLayout.TFDescription));
            }

            for (var i = 0; i < target.model.Relationships.length; i++) {
                var relationship = target.model.Relationships[i];
                relationships.push(new BMA.Model.Relationship(variableIndex++, idDic[relationship.FromVariableId], idDic[relationship.ToVariableId], relationship.Type));
            }

            var newmodel = new BMA.Model.BioModel(model.Name, variables, relationships);
            var newlayout = new BMA.Model.Layout(containerLayouts, variableLayouts);

            return {
                result: {
                    model: newmodel,
                    layout: newlayout
                },
                indexOffset: variableIndex
            };
        }

        export function ResizeContainer(model: BMA.Model.BioModel, layout: BMA.Model.Layout, containerId: number, containerSize: number, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): {
            model: BMA.Model.BioModel;
            layout: BMA.Model.Layout
        } {
            var container = layout.GetContainerById(containerId);
            if (container !== undefined) {
                var sizeDiff = containerSize - container.Size;
                var shouldMove = sizeDiff > 0;


                var containerLayouts = layout.Containers;
                var variables = model.Variables;
                var variableLayouts = layout.Variables;

                if (shouldMove) {
                    //Check if there is enough size for extending without replacing other contents
                    var wishfulCells = GetContainerExtraCells(container, containerSize);
                    var hasNonEmpty = false;
                    for (var i = 0; i < wishfulCells.length; i++) {
                        if (!IsGridCellEmpty(wishfulCells[i], model, layout, containerId, grid)) {
                            hasNonEmpty = true;
                            break;
                        }
                    }
                    shouldMove = hasNonEmpty;
                }

                var newCnt = [];
                for (var i = 0; i < containerLayouts.length; i++) {
                    var cnt = containerLayouts[i];
                    if (cnt.Id === container.Id) {
                        newCnt.push(new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, containerSize, cnt.PositionX, cnt.PositionY));
                    } else if (shouldMove && (cnt.PositionX > container.PositionX || cnt.PositionY > container.PositionY)) {
                        newCnt.push(new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, cnt.Size, cnt.PositionX > container.PositionX ? cnt.PositionX + sizeDiff : cnt.PositionX,
                            cnt.PositionY > container.PositionY ? cnt.PositionY + sizeDiff : cnt.PositionY));
                    } else
                        newCnt.push(cnt);
                }

                var cntX = container.PositionX * grid.xStep + grid.xOrigin;
                var cntY = container.PositionY * grid.yStep + grid.yOrigin;
                var newVL = [];
                for (var i = 0; i < variableLayouts.length; i++) {
                    var v = variables[i];
                    var vl = variableLayouts[i];
                    if (variables[i].ContainerId === container.Id) {
                        newVL.push(new BMA.Model.VariableLayout(vl.Id, cntX + (vl.PositionX - cntX) * containerSize / container.Size, cntY + (vl.PositionY - cntY) * containerSize / container.Size, 0, 0, vl.Angle));
                    } else {
                        if (shouldMove) {
                            if (v.Type === "Constant") {
                                newVL.push(new BMA.Model.VariableLayout(vl.Id,
                                    vl.PositionX > cntX + grid.xStep ? vl.PositionX + sizeDiff * grid.xStep : vl.PositionX,
                                    vl.PositionY > cntY + grid.yStep ? vl.PositionY + sizeDiff * grid.yStep : vl.PositionY,
                                    0, 0, vl.Angle));
                            } else {
                                var vCnt = layout.GetContainerById(v.ContainerId);
                                var vCntX = vCnt.PositionX * grid.xStep + grid.xOrigin;
                                var vCntY = vCnt.PositionY * grid.yStep + grid.yOrigin;

                                var unsizedVposX = (vl.PositionX - vCntX) / vCnt.Size + vCntX;
                                var unsizedVposY = (vl.PositionY - vCntY) / vCnt.Size + vCntY;

                                newVL.push(new BMA.Model.VariableLayout(vl.Id,
                                    unsizedVposX > cntX + grid.xStep ? vl.PositionX + sizeDiff * grid.xStep : vl.PositionX,
                                    unsizedVposY > cntY + grid.yStep ? vl.PositionY + sizeDiff * grid.yStep : vl.PositionY,
                                    0, 0, vl.Angle));
                            }
                        } else {
                            newVL.push(vl);
                        }
                    }
                }

                var newlayout = new BMA.Model.Layout(newCnt, newVL);
                var newModel = new BMA.Model.BioModel(model.Name, model.Variables, model.Relationships);

                return { model: newModel, layout: newlayout };
            }
        }

        export function GetModelSVGBoundingBox(model: BMA.Model.BioModel, layout: BMA.Model.Layout, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): { x: number; y: number; width: number; height: number } {
            var bottomLeft = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
            var topRight = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };


            //Getting Container BBoxes
            var cells = layout.Containers;
            for (var i = 0; i < cells.length; i++) {
                var cnt = cells[i];

                var xLeft = cnt.PositionX * grid.xStep + grid.xOrigin;
                var xRight = xLeft + grid.xStep;
                var yBottom = cnt.PositionY * grid.yStep + grid.yOrigin;
                var yTop = yBottom + grid.yStep;

                if (xLeft < bottomLeft.x)
                    bottomLeft.x = xLeft;
                if (xRight > topRight.x)
                    topRight.x = xRight;

                if (yBottom < bottomLeft.y)
                    bottomLeft.y = yBottom;
                if (yTop > topRight.y)
                    topRight.y = yTop;
            }


            var variables = model.Variables;

            for (var i = 0; i < variables.length; i++) {
                var vrbl = variables[i];
                var vLayout = layout.Variables[i];

                var elementBBox = (<BMA.Elements.BboxElement>window.ElementRegistry.GetElementByType(vrbl.Type)).GetBoundingBox(vLayout.PositionX, vLayout.PositionY);

                var xLeft = elementBBox.x;
                var xRight = elementBBox.x + elementBBox.width;
                var yBottom = elementBBox.y;
                var yTop = elementBBox.y + elementBBox.height;

                if (xLeft < bottomLeft.x)
                    bottomLeft.x = xLeft;
                if (xRight > topRight.x)
                    topRight.x = xRight;

                if (yBottom < bottomLeft.y)
                    bottomLeft.y = yBottom;
                if (yTop > topRight.y)
                    topRight.y = yTop;
            }

            return { x: bottomLeft.x, y: bottomLeft.y, width: topRight.x - bottomLeft.x, height: topRight.y - bottomLeft.y };
        }

        export function GetModelBoundingBox(model: BMA.Model.Layout, grid: { xOrigin: number; yOrigin: number; xStep: number; yStep: number }): { x: number; y: number; width: number; height: number } {
            var bottomLeftCell = { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
            var topRightCell = { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY };


            var cells = model.Containers;
            for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                if (cell.PositionX < bottomLeftCell.x) {
                    bottomLeftCell.x = cell.PositionX;
                }
                if (cell.PositionY < bottomLeftCell.y) {
                    bottomLeftCell.y = cell.PositionY;
                }
                if (cell.PositionX + cell.Size - 1 > topRightCell.x) {
                    topRightCell.x = cell.PositionX + cell.Size - 1;
                }
                if (cell.PositionY + cell.Size - 1 > topRightCell.y) {
                    topRightCell.y = cell.PositionY + cell.Size - 1;
                }
            }

            var variables = model.Variables;

            var getGridCell = function (x, y) {
                var cellX = Math.ceil((x - grid.xOrigin) / grid.xStep) - 1;
                var cellY = Math.ceil((y - grid.yOrigin) / grid.yStep) - 1;
                return { x: cellX, y: cellY };
            }

            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var gridCell = getGridCell(variable.PositionX, variable.PositionY);
                if (gridCell.x < bottomLeftCell.x) {
                    bottomLeftCell.x = gridCell.x;
                }
                if (gridCell.y < bottomLeftCell.y) {
                    bottomLeftCell.y = gridCell.y;
                }
                if (gridCell.x > topRightCell.x) {
                    topRightCell.x = gridCell.x;
                }
                if (gridCell.y > topRightCell.y) {
                    topRightCell.y = gridCell.y;
                }
            }


            if (cells.length === 0 && variables.length === 0) {
                return {
                    x: 0,
                    y: 0,
                    width: 5 * grid.xStep,
                    height: 4 * grid.yStep
                };
            } else {
                return {
                    x: bottomLeftCell.x * grid.xStep + grid.xOrigin,
                    y: bottomLeftCell.y * grid.yStep + grid.yOrigin,
                    width: (topRightCell.x - bottomLeftCell.x + 1) * grid.xStep,
                    height: (topRightCell.y - bottomLeftCell.y + 1) * grid.yStep
                };
            }
        }

        export function GetContainerGridCells(container: BMA.Model.ContainerLayout): { x: number, y: number }[] {
            var result = [];
            for (var i = 0; i < container.Size; i++) {
                for (var j = 0; j < container.Size; j++) {
                    var gridCell = {
                        x: container.PositionX + i,
                        y: container.PositionY + j
                    };
                    result.push(gridCell)
                }
            }

            //console.log("Total grid cells for container count: " + result.length);

            return result;
        }

        export function GetModelGridCells(model: BMA.Model.BioModel, layout: BMA.Model.Layout, grid: { x0: number; y0: number; xStep: number; yStep: number }): { x: number; y: number }[] {
            var result = [];

            //Matrix for cheching for already collected cells, [x,y] = true means that that cell is already added to result
            var contained = [];

            var variables = layout.Variables;
            
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];
                var gridCell = GetGridCell2(variable.PositionX, variable.PositionY, grid);

                if (contained[gridCell.x] === undefined) {
                    result.push(gridCell);
                    contained[gridCell.x] = [];
                    contained[gridCell.x][gridCell.y] = true;
                } else {
                    if (contained[gridCell.x][gridCell.y] !== true) {
                        result.push(gridCell);
                        contained[gridCell.x][gridCell.y] = true;
                    }
                }
            }

            var containers = layout.Containers;
            for (var i = 0; i < containers.length; i++) {
                var container = containers[i];

                var containerCells = GetContainerGridCells(container);
                for (var j = 0; j < containerCells.length; j++) {
                    var gridCell = containerCells[j];

                    if (contained[gridCell.x] === undefined) {
                        result.push(gridCell);
                        contained[gridCell.x] = [];
                        contained[gridCell.x][gridCell.y] = true;
                    } else {
                        if (contained[gridCell.x][gridCell.y] !== true) {
                            result.push(gridCell);
                            contained[gridCell.x][gridCell.y] = true;
                        }
                    }
                }
            }

            //console.log("model grid cells count: " + result.length);
            return result;
        }

        export function CutSubModel(model: BMA.Model.BioModel,
            layout: BMA.Model.Layout,
            selection: { variables: boolean[]; cells: boolean[]; relationships: boolean[]; }): { model: BMA.Model.BioModel, layout: BMA.Model.Layout } {

            var variables = [];
            var variableLayouts = [];
            var relationships = [];
            var containers = [];

            for (var i = 0; i < model.Variables.length; i++) {
                var variable = model.Variables[i];
                if (selection.variables[variable.Id] !== true) {
                    variables.push(variable);
                    variableLayouts.push(layout.Variables[i]);
                }
            }

            for (var i = 0; i < model.Relationships.length; i++) {
                var rel = model.Relationships[i];
                if (selection.relationships[rel.Id] !== true) {
                    relationships.push(rel);
                }
            }

            for (var i = 0; i < layout.Containers.length; i++) {
                var cnt = layout.Containers[i];
                if (selection.cells[cnt.Id] !== true) {
                    containers.push(cnt);
                }
            }

            var model = new BMA.Model.BioModel("cutted model", variables, relationships);
            var layout = new BMA.Model.Layout(containers, variableLayouts);

            return { model: model, layout: layout };
        }

        //Performs move for selected submodel inside source model usgin provided gridOffset. Returns modified model if it is possible and undefined otherwise.
        export function TryMoveSelection(
            model: BMA.Model.BioModel,
            layout: BMA.Model.Layout,
            selectedModel: BMA.Model.BioModel,
            selectedLayout: BMA.Model.Layout,
            gridOffset: { x: number; y: number },
            grid: { x0: number; y0: number; xStep: number; yStep: number }): { model: BMA.Model.BioModel; layout: BMA.Model.Layout } {

            var subModelSourceGridCells = GetModelGridCells(selectedModel, selectedLayout, grid);
            var subModelTargetGridCells = [];

            for (var i = 0; i < subModelSourceGridCells.length; i++) {
                var gridCell = subModelSourceGridCells[i];
                subModelTargetGridCells.push({ x: gridCell.x + gridOffset.x, y: gridCell.y + gridOffset.y });
            }

            var selection = { variables: [], cells: [], relationships: [] };
            for (var i = 0; i < selectedModel.Variables.length; i++) {
                selection.variables[selectedModel.Variables[i].Id] = true;
            }
            for (var i = 0; i < selectedModel.Relationships.length; i++) {
                selection.relationships[selectedModel.Relationships[i].Id] = true;
            }
            for (var i = 0; i < selectedLayout.Containers.length; i++) {
                selection.cells[selectedLayout.Containers[i].Id] = true;
            }

            var cutted = CutSubModel(model, layout, selection);

            var canMove = true;
            for (var i = 0; i < subModelTargetGridCells.length; i++) {
                var gridCellToCheck = subModelTargetGridCells[i];
                if (!IsGridCellEmpty2(gridCellToCheck, cutted.model, cutted.layout, undefined, grid)) {
                    canMove = false;
                    break;
                }
            }

            if (canMove) {
                var variables = [];
                var variableLayouts = [];
                var relationships = [];
                var containers = [];

                for (var i = 0; i < model.Variables.length; i++) {
                    var variable = model.Variables[i];
                    var variableLayout = layout.Variables[i];
                    if (selection.variables[variable.Id] !== true) {
                        variables.push(variable);
                        variableLayouts.push(variableLayout);
                    } else {
                        variables.push(variable);

                        var newVariableLayout =
                            new BMA.Model.VariableLayout(
                                variableLayout.Id,
                                variableLayout.PositionX + gridOffset.x * grid.xStep,
                                variableLayout.PositionY + gridOffset.y * grid.yStep,
                                0,
                                0,
                                variableLayout.Angle);

                        variableLayouts.push(newVariableLayout);
                    }
                }

                for (var i = 0; i < layout.Containers.length; i++) {
                    var cnt = layout.Containers[i];
                    if (selection.cells[cnt.Id] !== true) {
                        containers.push(cnt);
                    } else {
                        var newCnt = new BMA.Model.ContainerLayout(cnt.Id, cnt.Name, cnt.Size, cnt.PositionX + gridOffset.x, cnt.PositionY + gridOffset.y);
                        containers.push(newCnt);
                    }
                }

                var model = new BMA.Model.BioModel(model.Name, variables, model.Relationships);
                var layout = new BMA.Model.Layout(containers, variableLayouts);

                return { model: model, layout: layout };
            }

            return undefined;
        }

        /**
         * Calculate updated states array according to model and layout
         * 1) If variable was renamed, corresponding state would be updated
         * 2) If variable was removed, corresponding state would be deleted
         * 3) If name operands in state have no ids, they would receive them from model
         * 4) If name operand in state has no id and there are multiple variables with same name in model, it would get first founded id 
         * and it would be flagged in "shouldNotify"
         * 5) If there were any changes from initial states array, it would be flagged in "isChanged"
         * @param model
         * @param layout
         * @param states
         */
        export function UpdateStatesWithModel(model: BMA.Model.BioModel, layout: BMA.Model.Layout, states: BMA.LTLOperations.Keyframe[]): { states: BMA.LTLOperations.Keyframe[], isChanged: boolean, shouldNotify: boolean } {

            var isChanged = false;
            var shouldNotify = false;
            var newStates = [];
            for (var i = 0; i < states.length; i++) {
                var state = states[i];
                var operands = [];
                var isActual = true;
                for (var j = 0; j < state.Operands.length; j++) {
                    var operand = state.Operands[j];
                    var variable;
                    if (operand instanceof BMA.LTLOperations.KeyframeEquation) {
                        variable = operand.LeftOperand;
                    } /*else if (operand instanceof BMA.LTLOperations.DoubleKeyframeEquation) {
                        variable = operand.MiddleOperand;
                    }*/
                    if (variable instanceof BMA.LTLOperations.NameOperand) {
                        var variableId = variable.Id;
                        if (variableId === undefined) {
                            var id = model.GetIdByName(variable.Name);
                            if (id.length == 0) {
                                isActual = false;
                                isChanged = true;
                                break;
                            }
                            if (id.length > 1)
                                shouldNotify = true;
                            variableId = parseFloat(id[0]);
                            isChanged = true;
                        }

                        var variableInModel = model.GetVariableById(variableId);
                        if (variableInModel === undefined/* || !variableInModel.Name*/) {
                            isActual = false;
                            isChanged = true;
                            break;
                        }
                        if (variable.Name != variableInModel.Name)
                            isChanged = true;
                        variable = new BMA.LTLOperations.NameOperand(variableInModel.Name, variableInModel.Id);

                        var newOperand;
                        if (operand instanceof BMA.LTLOperations.KeyframeEquation) {
                            newOperand = new BMA.LTLOperations.KeyframeEquation(variable, operand.Operator, operand.RightOperand);
                        } /*else if (operand instanceof BMA.LTLOperations.DoubleKeyframeEquation) {
                            newOperand = new BMA.LTLOperations.DoubleKeyframeEquation(operand.LeftOperand, operand.LeftOperator, variable, operand.RightOperator, operand.RightOperand);
                        }*/
                        operands.push(newOperand);
                    }
                }
                if (isActual && operands.length != 0)
                    newStates.push(new BMA.LTLOperations.Keyframe(state.Name, state.Description, operands));
            }

            return {
                states: newStates,
                isChanged: isChanged,
                shouldNotify: shouldNotify
            };
        }

        export function UpdateFormulasAfterVariableChanged(variableId: number, oldModel: BMA.Model.BioModel, newModel: BMA.Model.BioModel) {

            if (variableId !== undefined && newModel) {
                var variables = oldModel.Variables;
                var editingVariableIndex = -1;
                for (var i = 0; i < variables.length; i++) {
                    if (variables[i].Id === variableId) {
                        editingVariableIndex = i;
                        break;
                    }
                }

                var editedVariableIndex = -1;
                for (var j = 0; j < newModel.Variables.length; j++) {
                    if (newModel.Variables[j].Id === variableId) {
                        editedVariableIndex = j;
                        break;
                    }
                }

                if (editingVariableIndex != -1 && editedVariableIndex != -1) {
                    var oldName = variables[editingVariableIndex].Name;
                    var newName = newModel.Variables[editedVariableIndex].Name
                    if (oldName != newName) {
                        var ids = BMA.ModelHelper.FindAllRelationships(variableId, newModel.Relationships);
                        var newVariables = [];
                        for (var j = 0; j < newModel.Variables.length; j++) {
                            var variable = newModel.Variables[j];
                            var oldFormula = variable.Formula;
                            var newFormula = undefined;
                            for (var k = 0; k < ids.length; k++) {
                                if (variable.Id == ids[k]) {
                                    newFormula = oldFormula.replace(new RegExp("var\\(" + oldName + "\\)", 'g'),
                                        "var(" + newName + ")");
                                    break;
                                }
                            }
                            newVariables.push(new BMA.Model.Variable(
                                variable.Id,
                                variable.ContainerId,
                                variable.Type,
                                variable.Name,
                                variable.RangeFrom,
                                variable.RangeTo,
                                newFormula === undefined ? oldFormula : newFormula)
                            );
                        }

                        var newRelations = [];
                        for (var j = 0; j < newModel.Relationships.length; j++) {
                            newRelations.push(new BMA.Model.Relationship(
                                newModel.Relationships[j].Id,
                                newModel.Relationships[j].FromVariableId,
                                newModel.Relationships[j].ToVariableId,
                                newModel.Relationships[j].Type)
                            );
                        }
                        newModel = new BMA.Model.BioModel(newModel.Name, newVariables, newRelations);
                    }
                }
                //We do not edit variables formula automatically as we allow to save "broken" variables now
                /*else if (editingVariableIndex != -1) {
                    var oldName = variables[editingVariableIndex].Name;
                    var ids = BMA.ModelHelper.FindAllRelationships(variableId, oldModel.Relationships);
                    var newVariables = [];
                    for (var j = 0; j < newModel.Variables.length; j++) {
                        var variable = newModel.Variables[j];
                        var oldFormula = variable.Formula;
                        var newFormula = undefined;
                        for (var k = 0; k < ids.length; k++) {
                            if (variable.Id == ids[k]) {
                                newFormula = oldFormula.replace(new RegExp("var\\(" + oldName + "\\)", 'g'), "");
                                break;
                            }
                        }
                        newVariables.push(new BMA.Model.Variable(
                            variable.Id,
                            variable.ContainerId,
                            variable.Type,
                            variable.Name,
                            variable.RangeFrom,
                            variable.RangeTo,
                            newFormula === undefined ? oldFormula : newFormula)
                        );
                    }
                    var newRelations = [];
                    for (var j = 0; j < newModel.Relationships.length; j++) {
                        newRelations.push(new BMA.Model.Relationship(
                            newModel.Relationships[j].Id,
                            newModel.Relationships[j].FromVariableId,
                            newModel.Relationships[j].ToVariableId,
                            newModel.Relationships[j].Type)
                        );
                    }
                    newModel = new BMA.Model.BioModel(newModel.Name, newVariables, newRelations);
                }*/
            }

            return newModel;
        }

        export function FindAllRelationships(id: number, relationships: BMA.Model.Relationship[]) {
            var variableIds = [];
            for (var i = 0; i < relationships.length; i++) {
                if (relationships[i].FromVariableId === id)
                    variableIds.push(relationships[i].ToVariableId)
            }
            return variableIds.sort((x, y) => {
                return x < y ? -1 : 1;
            });;
        }

        export function GenerateStateName(states: BMA.LTLOperations.Keyframe[], newState: BMA.LTLOperations.Keyframe): string {
            var k = states.length;
            var lastStateName = "A";
            for (var i = 0; i < k; i++) {
                var lastStateIdx = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;
                var stateName = states[i].Name ? states[i].Name : "A";
                var stateIdx = stateName.length > 1 ? parseFloat(stateName.slice(1)) : 0;

                if (stateIdx >= lastStateIdx) {
                    lastStateName = (lastStateName && stateIdx == lastStateIdx
                        && lastStateName.charAt(0) > stateName.charAt(0)) ?
                        lastStateName : stateName;
                }
            }

            var newStateName = newState && newState.Name ? newState.Name : "A";
            var newStateIdx = (newStateName && newStateName.length > 1) ? parseFloat(newStateName.slice(1)) : 0;

            if (lastStateName && ((lastStateIdx == newStateIdx && lastStateName.charAt(0) >= newStateName.charAt(0))
                || lastStateIdx > newStateIdx)) {

                var charCode = lastStateName ? lastStateName.charCodeAt(0) : 65;
                var n = (lastStateName && lastStateName.length > 1) ? parseFloat(lastStateName.slice(1)) : 0;

                if (charCode >= 90) {
                    n++;
                    charCode = 65;
                } else if (lastStateName) charCode++;


                newStateName = n ? String.fromCharCode(charCode) + n : String.fromCharCode(charCode);
            }
            return newStateName;
        }

        export function GetScrollBarSize(): { width: number, height: number } {
            var $outer = $('<div>').css({ visibility: 'hidden', width: 100, height: 100, overflow: 'scroll' }).appendTo('body'),
                widthWithScroll = $('<div>').css({ width: '100%' }).appendTo($outer).outerWidth(),
                heightWithScroll = $('<div>').css({ height: '100%' }).appendTo($outer).outerHeight();
            $outer.remove();
            var width = 100 - widthWithScroll;
            var height = 100 - heightWithScroll;

            return { width: width, height: height };
        }

        export function ConvertFormulaToOperation(formula: string, states: BMA.LTLOperations.Keyframe[], model: BMA.Model.BioModel): { operation: BMA.LTLOperations.Operation, states: BMA.LTLOperations.Keyframe[] } {
            var parsedFormula;
            try {
                var parsedFormula = BMA.parser.parse(formula);
                var result = ConvertToOperation(parsedFormula, states, model);
                var operation = result.operation;
                if (operation instanceof BMA.LTLOperations.Operation)
                    return {
                        operation: operation,
                        states: result.states
                    };
            } catch (ex) {
                alert(ex);
            }
            return undefined;
        }

        export function UpdateOperationStates(operation, mergedStates) {
            var that = this;
            for (var i = 0; i < operation.Operands.length; i++) {
                var op = operation.Operands[i];
                if (op instanceof BMA.LTLOperations.Keyframe) {
                    if (mergedStates.map[op.Name]) {
                        for (var j = 0; j < mergedStates.states.length; j++)
                            if (mergedStates.states[j].Name == mergedStates.map[op.Name]
                                && BMA.LTLOperations.GetLTLServiceProcessingFormula(mergedStates.states[j]) == BMA.LTLOperations.GetLTLServiceProcessingFormula(op))
                                op.Name = mergedStates.map[op.Name];
                    } else op = undefined;
                } else if (op instanceof BMA.LTLOperations.Operation) {
                    BMA.ModelHelper.UpdateOperationStates(op, mergedStates);
                }
            }
        }

        export function UpdateStatesAfterMerging(oldStates, state1, state2) {
            var newState = BMA.ModelHelper.MergeTwoStatesInOne(state1, state2);
            var mergedStates = BMA.ModelHelper.MergeStates(oldStates, [newState]);
            for (var i = 0; i < mergedStates.states.length; i++)
                if (mergedStates.states[i].Name == mergedStates.map[newState.Name]) {
                    var formula = { state: mergedStates.states[i].Name };
                    return { operation: mergedStates.states[i].Clone(), states: mergedStates.states, formula: formula };
                }
            return undefined;
        }

        export function ConvertToOperation(formula: any, states: BMA.LTLOperations.Keyframe[], model: BMA.Model.BioModel): { operation: BMA.LTLOperations.IOperand, states: BMA.LTLOperations.Keyframe[], formula?: any } {
            if (!formula) throw "Nothing to import";
            //if (formula.state && states) {
            //    for (var i = 0; i < states.length; i++) {
            //        if (states[i].Name == formula.state)
            //            return { operation: states[i].Clone(), states: states };
            //    }
            //    if (formula.state.toUpperCase() == "OSCILLATION")
            //        return { operation: new BMA.LTLOperations.OscillationKeyframe(), states: states };
            //    if (formula.state.toUpperCase() == "SELFLOOP")
            //        return { operation: new BMA.LTLOperations.SelfLoopKeyframe(), states: states };
            //    if (formula.state.toUpperCase() == "TRUE")
            //        return { operation: new BMA.LTLOperations.TrueKeyframe(), states: states };
            //    return undefined;
            //} else {
            //    if (formula.operator) {
            //        var operation = new BMA.LTLOperations.Operation();
            //        var operands = [];
            //        var operator = window.OperatorsRegistry.GetOperatorByName(formula.operator.toUpperCase());
            //        if (operator === undefined) throw "Operator doesn't exist";
            //        for (i = 0; i < formula.operands.length; i++) {
            //            operands.push(ConvertToOperation(formula.operands[i], states, model));
            //        }
            //        operation.Operator = operator;
            //        operation.Operands = operands;
            //        return { operation: operation, states: states, formula: formula };
            //    }
            //}
            //throw "Operation was not found";
            if (formula.state && states) {
                if (formula.state.variable === undefined) {
                    for (var i = 0; i < states.length; i++) {
                        if (states[i].Name == formula.state)
                            return { operation: states[i].Clone(), states: states };
                    }
                    if (formula.state.toUpperCase() == "OSCILLATION")
                        return { operation: new BMA.LTLOperations.OscillationKeyframe(), states: states };
                    if (formula.state.toUpperCase() == "SELFLOOP")
                        return { operation: new BMA.LTLOperations.SelfLoopKeyframe(), states: states };
                    if (formula.state.toUpperCase() == "TRUE")
                        return { operation: new BMA.LTLOperations.TrueKeyframe(), states: states };
                    return undefined;
                } else if (formula.state.variable && formula.state.operator && formula.state.const !== undefined) {
                    var variableID = model.GetIdByName(formula.state.variable);
                    if (variableID.length == 0) throw "Variable '" + formula.state.variable + "' is not found";
                    var state = new BMA.LTLOperations.Keyframe("A", "", [
                        new BMA.LTLOperations.KeyframeEquation(new BMA.LTLOperations.NameOperand(formula.state.variable, parseFloat(variableID[0])),
                            formula.state.operator, new BMA.LTLOperations.ConstOperand(parseFloat(formula.state.const)))]);
                    var mergedStates = BMA.ModelHelper.MergeStates(states, [state]);
                    for (var i = 0; i < mergedStates.states.length; i++)
                        if (mergedStates.states[i].Name == mergedStates.map[state.Name])
                            return { operation: mergedStates.states[i].Clone(), states: mergedStates.states };
                    return undefined;
                }
            } else {
                if (formula.operator) {
                    var operation = new BMA.LTLOperations.Operation();
                    var operands = [];
                    var operator = window.OperatorsRegistry.GetOperatorByName(formula.operator.toUpperCase());
                    if (operator === undefined) throw "Operator doesn't exist";
                    var newStates = [];
                    var formulaChanged = false;
                    for (i = 0; i < formula.operands.length; i++) {
                        var result = ConvertToOperation(formula.operands[i], states, model);
                        if (result !== undefined) {
                            newStates.push(result.states);
                            operands.push(result.operation);
                            if (result.formula) {
                                formula.operands[i] = result.formula;
                                formulaChanged = true;
                            }
                        } else {
                            operands.push(result);
                        }
                    }
                    if (operator.Name == "AND") {
                        if (formula.operands[0] && formula.operands[0].state && formula.operands[1] && formula.operands[1].state) {
                            //if (operands[0].GetFormula() == operands[1].GetFormula())
                            //    return { operation: operands[0].Clone(), states: states };
                            if (formula.operands[0].state.variable && formula.operands[1].state.variable) {
                                return BMA.ModelHelper.UpdateStatesAfterMerging(states, operands[0], operands[1]);
                            } else if (formula.operands[0].state.variable && formulaChanged) {
                                for (var j = 0; j < newStates[1].length; j++)
                                    if (newStates[1][j].Name == formula.operands[1].state) {
                                        return BMA.ModelHelper.UpdateStatesAfterMerging(states, newStates[1][j], operands[0]);
                                    }
                                return undefined;
                            } else if (formula.operands[1].state.variable && formulaChanged) {
                                for (var j = 0; j < newStates[0].length; j++)
                                    if (newStates[0][j].Name == formula.operands[0].state) {
                                        return BMA.ModelHelper.UpdateStatesAfterMerging(states, newStates[0][j], operands[1]);
                                    }
                                return undefined;
                            }
                        }
                    }

                    operation.Operator = operator;
                    operation.Operands = operands;

                    for (var i = 0; i < newStates.length; i++) {
                        if (JSON.stringify(states) !== JSON.stringify(newStates[i])) {
                            var mergedStates = BMA.ModelHelper.MergeStates(states, newStates[i]);
                            states = mergedStates.states;
                        }
                    }

                    if (mergedStates)
                        BMA.ModelHelper.UpdateOperationStates(operation, mergedStates);

                    return { operation: operation, states: states, formula: formula };
                }
            }
            throw "Operation was not found";//return undefined;
        }

        export function ConvertTFtoOperation(formula: any, variables: BMA.Model.Variable[]): any {
            if (!formula) throw "Nothing to import";
            if (formula.var) {
                var variableID;
                for (var i = 0; i < variables.length; i++) {
                    if (variables[i].Name == formula.var) {
                        variableID = variables[i].Id;
                        break;
                    }
                }
                if (variableID === undefined) throw "Variable '" + formula.var + "' is not found";
                return new BMA.LTLOperations.NameOperand(formula.var, parseFloat(variableID));
            } else if (formula.const) {
                return new BMA.LTLOperations.ConstOperand(parseFloat(formula.const));
            } else if (formula.opr) {
                var operation = new BMA.LTLOperations.Operation();
                var operands = [];
                var operator = window.OperatorsRegistry.GetOperatorByName(formula.opr.toUpperCase());
                if (operator === undefined) throw "Operator doesn't exist";
                for (var i = 0; i < formula.opnds.length; i++) {
                    var operand = formula.opnds[i];
                    operands.push(ConvertTFtoOperation(formula.opnds[i], variables));
                }

                operation.Operator = operator;
                operation.Operands = operands;
                return operation;
            }
        }

        export function ConvertTFOperationToString(operation: BMA.LTLOperations.IOperand): string {
            var op = "";
            if (operation instanceof BMA.LTLOperations.ConstOperand) {
                op += operation.Value;
            } else if (operation instanceof BMA.LTLOperations.NameOperand) {
                op += "var(" + operation.Name + ")";
            } else if (operation instanceof BMA.LTLOperations.Operation) {
                if (operation.Operator.IsFunction) { //function()
                    op += operation.Operator.Name.toLowerCase() + "(" + BMA.ModelHelper.ConvertTFOperationToString(operation.Operands[0]);
                    for (var i = 1; i < operation.Operands.length; i++) {
                        op += ", " + BMA.ModelHelper.ConvertTFOperationToString(operation.Operands[i]);
                    }
                    if (operation.Operands.length < operation.Operator.MinOperandsCount)
                        op += ",";
                    op += ")";
                } else {//x + y
                    op += BMA.ModelHelper.ConvertTFOperationToString(operation.Operands[0]) + " " + operation.Operator.Name + " " + BMA.ModelHelper.ConvertTFOperationToString(operation.Operands[1]);
                    for (var i = 2; i < operation.Operands.length; i++) {
                        op += " " + operation.Operator.Name + " " + BMA.ModelHelper.ConvertTFOperationToString(operation.Operands[i]);
                    }
                }
            }
            return op;
        }

        export function ConvertTargetFunctionToOperation(formula: string, variables: BMA.Model.Variable[]): any {
            var parsedFormula;
            if (formula == "") return undefined;
            var parsedFormula = BMA.TFParser.parse(formula);
            return ConvertTFtoOperation(parsedFormula, variables);
        }

        export function CompareOperationsPriority(op1: BMA.LTLOperations.Operation, op2: BMA.LTLOperations.IOperand) {

            var getPriority = function (op) {
                var opPriority;
                switch (op.Operator.Name) {
                    case "NEXT":
                        opPriority = 1;
                        break;
                    case "ALWAYS":
                        opPriority = 1;
                        break;
                    case "EVENTUALLY":
                        opPriority = 1;
                        break;
                    case "NOT":
                        opPriority = 1;
                        break;
                    case "UNTIL":
                        opPriority = 2;
                        break;
                    case "RELEASE":
                        opPriority = 2;
                        break;
                    case "WEAKUNTIL":
                        opPriority = 2;
                        break;
                    case "UPTO":
                        opPriority = 2;
                        break;
                    case "AND":
                        opPriority = 3;
                        break;
                    case "OR":
                        opPriority = 4;
                        break;
                    case "IMPLIES":
                        opPriority = 5;
                        break;
                    default: opPriority = 6;
                        break;
                }
                return opPriority;
            }

            if (op2 instanceof BMA.LTLOperations.Operation && getPriority(op1) < getPriority(op2))
                return 1;
            else if (op2 instanceof BMA.LTLOperations.Operation && getPriority(op1) == getPriority(op2) && getPriority(op1) !== 5)
                return 2;
            else return 0;
        }

        export function ConvertOperationToString(operation: BMA.LTLOperations.IOperand, extendedStates: boolean = false): string {
            var op = "";
            if (operation instanceof BMA.LTLOperations.Keyframe) {
                if (extendedStates) {
                    if (operation.Operands.length == 0) throw "Unsuitable states are found";
                    op += "(";
                    for (var i = 0; i < operation.Operands.length; i++) {
                        if (i != 0)
                            op += "and ";
                        var operand = operation.Operands[i];
                        //op += operand.GetFormula() + " ";
                        if (operand instanceof BMA.LTLOperations.KeyframeEquation)
                            op += (<BMA.LTLOperations.NameOperand>operand.LeftOperand).Name + operand.Operator + (<BMA.LTLOperations.ConstOperand>operand.RightOperand).Value + " ";
                        else throw "Unknown type of keyframe equation";
                    }
                    op = op.trim() + ") ";
                } else {
                    var name = operation.Name ? operation.Name : "Unnamed";
                    op += name + " ";
                }
            } else if (operation instanceof BMA.LTLOperations.SelfLoopKeyframe) {
                op += "SelfLoop ";
            } else if (operation instanceof BMA.LTLOperations.OscillationKeyframe) {
                op += "Oscillation ";
            } else if (operation instanceof BMA.LTLOperations.TrueKeyframe) {
                op += "True ";
            } else if (operation instanceof BMA.LTLOperations.Operation) {
                if (operation.Operator.MinOperandsCount == 2) {
                    op += (BMA.ModelHelper.CompareOperationsPriority(operation, operation.Operands[0]) == 1 ? "(" + (BMA.ModelHelper.ConvertOperationToString(operation.Operands[0], extendedStates)).trim() + ") " :
                        BMA.ModelHelper.ConvertOperationToString(operation.Operands[0], extendedStates)) + operation.Operator.Name.toLowerCase() + " " +
                        (BMA.ModelHelper.CompareOperationsPriority(operation, operation.Operands[1]) ? "(" + BMA.ModelHelper.ConvertOperationToString(operation.Operands[1], extendedStates).trim() + ") " :
                            BMA.ModelHelper.ConvertOperationToString(operation.Operands[1], extendedStates));
                } else if (operation.Operator.MinOperandsCount == 1) {
                    op += operation.Operator.Name.toLowerCase() + " " + (BMA.ModelHelper.CompareOperationsPriority(operation, operation.Operands[0]) == 1 ?
                        "(" + BMA.ModelHelper.ConvertOperationToString(operation.Operands[0], extendedStates).trim() + ") " :
                        BMA.ModelHelper.ConvertOperationToString(operation.Operands[0], extendedStates));
                }
            } else if (!operation) {
                op += "undefined" + " ";
            }
            return op;
        }

        export function MergeStates(currentStates: BMA.LTLOperations.Keyframe[], newStates: BMA.LTLOperations.Keyframe[]): { states: BMA.LTLOperations.Keyframe[]; map: any } {
            var result = {
                states: [],
                map: {}
            };

            result.states = currentStates.slice(0);
            var statesToAdd = [];

            for (var i = 0; i < newStates.length; i++) {
                var newState = newStates[i];
                var exist = false;
                var oldStates = {};
                for (var j = 0; j < currentStates.length; j++) {
                    var curState = currentStates[j];
                    if (BMA.LTLOperations.GetLTLServiceProcessingFormula(curState) === BMA.LTLOperations.GetLTLServiceProcessingFormula(newState)) {
                        exist = true;
                        oldStates[curState.Name] = curState;
                        result.map[newState.Name] = curState.Name;
                    }
                }
                if (oldStates[newState.Name]) {
                    result.map[newState.Name] = newState.Name;
                }
                if (!exist) {
                    statesToAdd.push(newState.Clone());
                }
            }

            for (var i = 0; i < statesToAdd.length; i++) {
                var addedState = statesToAdd[i].Clone();
                addedState.Name = BMA.ModelHelper.GenerateStateName(result.states, statesToAdd[i]);//String.fromCharCode(65 + result.states.length);
                result.states.push(addedState);
                result.map[statesToAdd[i].Name] = addedState.Name;
            }

            return result;
        }

        export function MergeTwoStatesInOne(state1: BMA.LTLOperations.Keyframe, state2: BMA.LTLOperations.Keyframe): BMA.LTLOperations.Keyframe {
            var newState = new BMA.LTLOperations.Keyframe("A", "", []);

            for (var i = 0; i < state1.Operands.length; i++)
                newState.Operands.push(state1.Operands[i].Clone());

            //if (state1.GetFormula() !== state2.GetFormula()) {
            for (var i = 0; i < state2.Operands.length; i++) {
                //if (newState.Operands.indexOf(state2.Operands[i]) == -1) 
                newState.Operands.push(state2.Operands[i].Clone());
            }
            //}

            return newState;
        }

        //Returns list of variables with incorrect target functions
        export function CheckVariablesInModel(model: BMA.Model.BioModel): any[] {
            var result = [];
            var variables = model.Variables;
            var relationships = model.Relationships;
            for (var i = 0; i < variables.length; i++) {
                var variable = variables[i];

                var connectedVariables = [];
                for (var j = 0; j < relationships.length; j++) {
                    var rel = relationships[j];
                    if (rel.ToVariableId === variable.Id) {
                        connectedVariables.push(model.GetVariableById(rel.FromVariableId));
                    }
                }
                var formula = variable.Formula;
                if (formula !== "") {
                    try {
                        var parsedFormula = BMA.TFParser.parse(formula);
                    } catch (ex) {
                        result.push({
                            name: variable.Name, error: ex
                        });
                    }
                }
            }

            return result;
        }

        // May return false if it failed, but this is not always
        // possible. Browser support for Chrome 43+, Firefox 42+, Edge and IE 10+.
        // No Safari support, as of (Nov. 2015). Returns false.
        // IE: The clipboard feature may be disabled by an adminstrator. By default a prompt is
        // shown the first time the clipboard is used (per session).
        export function CopyToClipboard(text) {
            if ((<any>window).clipboardData && (<any>window).clipboardData.setData) {
                // IE specific code path to prevent textarea being shown while dialog is visible.
                return (<any>window).clipboardData.setData("Text", text);

            } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
                var textarea = document.createElement("textarea");
                textarea.textContent = text;
                textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    return document.execCommand("copy");  // Security exception may be thrown by some browsers.
                } catch (ex) {
                    console.warn("Copy to clipboard failed.", ex);
                    return false;
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        }

    }
} 
