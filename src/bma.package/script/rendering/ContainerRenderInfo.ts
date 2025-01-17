﻿module BMA {
    export module SVGRendering {
        export class ContainerRenderInfo extends ElementRenderInfo implements BorderContainerElement {
            private jqSvg: any;

            private cellData: string;
            private cellGeometry: any;

            constructor(svg: any) {
                super("Container", "Cell", "cell-icon");
                this.jqSvg = svg;

                this.cellData = "M 640.36 249.05 c 113.22 0 205.33 106.84 205.33 238.16 S 753.58 725.37 640.36 725.37 S 435 618.53 435 487.21 s 92.11 -238.16 205.32 -238.16 m 0 -22.73 c -126 0 -228.06 116.8 -228.06 260.89 S 514.41 748.1 640.36 748.1 S 868.43 631.3 868.43 487.21 S 766.32 226.32 640.36 226.32 Z";;
            }

            public ContainsBBox(bbox: { x: number, y: number, width: number, height: number }, elementX: number, elementY: number, elementParams): boolean {
                var iscontaining = function (x, y) {
                    var dstX = Math.abs(x - (elementX + BMA.SVGRendering.SVGRenderingConstants.containerInnerCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1)));
                    var dstY = Math.abs(y - elementY - elementParams.yStep * (elementParams.Size - 1));
                    return Math.pow(dstX / (BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight * elementParams.Size), 2) < 1
                }

                var leftTop = iscontaining(bbox.x, bbox.y);
                var leftBottom = iscontaining(bbox.x, bbox.y + bbox.height);
                var rightTop = iscontaining(bbox.x + bbox.width, bbox.y);
                var rightBottom = iscontaining(bbox.x + bbox.width, bbox.y + bbox.height);

                return leftTop && leftBottom && rightTop && rightBottom;
            }

            public IntersectsBorder(pointerX: number, pointerY: number, elementX, elementY, elementParams): boolean {
                var innerCenterX = elementX + BMA.SVGRendering.SVGRenderingConstants.containerInnerCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1);
                var dstXInner = Math.abs(pointerX - innerCenterX);

                var outerCenterX = elementX + BMA.SVGRendering.SVGRenderingConstants.containerOuterCenterOffset * elementParams.Size + elementParams.xStep * (elementParams.Size - 1);
                var dstXOuter = Math.abs(pointerX - outerCenterX);

                var centerY = elementY + elementParams.yStep * (elementParams.Size - 1);
                var dstY = Math.abs(pointerY - centerY);

                var outerCheck = Math.pow(dstXOuter / (BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseHeight * elementParams.Size), 2) < 1;
                var innerCheck = Math.pow(dstXInner / (BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth * elementParams.Size), 2) + Math.pow(dstY / (BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight * elementParams.Size), 2) > 1;
                return outerCheck && innerCheck;
            }

            public Contains(pointerX: number, pointerY: number, elementX, elementY) {
                return false;
            }

            public RenderToCanvas(context: any, renderParams: any) {
                var that = this;

                if (that.cellGeometry === undefined) {
                    that.cellGeometry = new Path2D(this.cellData);
                }

                var pathFill = "#d0e9f0";
                var selectedPathFill = '#62b9d1';

                var scale = 0.52 * renderParams.layout.Size;

                if ((<any>window).VisualSettings !== undefined && (<any>window).VisualSettings.IsOldColorSchemeEnabled) {
                    pathFill = "#faaf40";
                    selectedPathFill = "gray";
                }

                if (renderParams.isHighlighted !== undefined && !renderParams.isHighlighted) {
                    pathFill = "#EDEDED";
                }

                var cs = renderParams.coordinateTransform;

                var containerCenter = {
                    x: (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + (renderParams.layout.Size - 1) * renderParams.grid.xStep * 0.5,
                    y: (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep * 0.5
                };

                var x = cs.dataToScreenX(containerCenter.x); 
                var y = cs.dataToScreenY(containerCenter.y); 

                //render background rectangle
                if (renderParams.background !== undefined) {
                    context.fillStyle = renderParams.background;

                    var xRect = cs.dataToScreenX(renderParams.layout.PositionX * renderParams.grid.xStep);
                    var yRect = cs.dataToScreenY(renderParams.layout.PositionY * renderParams.grid.yStep);
                    var rWidth = cs.plotToScreenWidth(renderParams.grid.xStep * renderParams.layout.Size);
                    var rHeight = cs.plotToScreenHeight(renderParams.grid.yStep * renderParams.layout.Size);

                    context.fillRect(xRect, yRect, rWidth, rHeight);
                }

                
                //Render main geometry
                context.beginPath();
                context.fillStyle = pathFill;
                context.strokeStyle = renderParams.isSelected ? selectedPathFill : pathFill;
                context.thickness = 2;
                context.translate(x, y);
                context.scale(cs.plotToScreenWidth(scale), cs.plotToScreenHeight(scale));
                context.translate(-640, -487);
                context.fill(that.cellGeometry);
                context.stroke(that.cellGeometry);
                context.setTransform(1, 0, 0, 1, 0, 0);

                //Inner Ellipse
                var xThickness = BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseWidth - BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth;
                var yThickness = BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseHeight - BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight;
                context.fillStyle = "white";
                context.ellipse(
                    x + cs.plotToScreenWidth(BMA.SVGRendering.SVGRenderingConstants.containerInnerCenterOffset * renderParams.layout.Size),
                    y,
                    cs.plotToScreenWidth(BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth * renderParams.layout.Size + xThickness * (renderParams.layout.Size - 1)),
                    cs.plotToScreenHeight(BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight * renderParams.layout.Size + yThickness * (renderParams.layout.Size - 1)),
                    0, 0, 2 * Math.PI);
                context.fill();

                if (that.LabelVisibility === true) {
                    var xText = cs.dataToScreenX(containerCenter.x - renderParams.layout.Size * renderParams.grid.xStep / 2 + 5 * renderParams.layout.Size);
                    var yText = cs.dataToScreenY(containerCenter.y - renderParams.layout.Size * renderParams.grid.yStep / 2 + that.LabelSize * renderParams.layout.Size + 5 * renderParams.layout.Size);

                    context.fillStyle = "black";
                    context.font = cs.plotToScreenHeight(that.LabelSize * renderParams.layout.Size) + "px " + BMA.SVGRendering.SVGRenderingConstants.textFontFamily;
                    context.fillText(renderParams.layout.Name, xText, yText);
                }
            }

            public RenderToSvg(renderParams: any) {
                var that = this;
                var jqSvg = this.jqSvg;
                if (jqSvg === undefined)
                    return undefined;
                jqSvg.clear();

                var x = (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2;
                var y = (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2;

                if (renderParams.translate !== undefined) {
                    x += renderParams.translate.x;
                    y += renderParams.translate.y;
                }

                var g = jqSvg.group({
                    transform: "translate(" + x + ", " + y + ")"
                });

                if (!renderParams.textOnly) {

                    jqSvg.rect(g,
                        - renderParams.grid.xStep * renderParams.layout.Size / 2 + renderParams.grid.xStep * BMA.SVGRendering.SVGRenderingConstants.containerPaddingCoef + (renderParams.translate === undefined ? 0 : renderParams.translate.x),
                        - renderParams.grid.yStep * renderParams.layout.Size / 2 + renderParams.grid.yStep * BMA.SVGRendering.SVGRenderingConstants.containerPaddingCoef + (renderParams.translate === undefined ? 0 : renderParams.translate.y),
                        renderParams.grid.xStep * renderParams.layout.Size - 2 * renderParams.grid.xStep * BMA.SVGRendering.SVGRenderingConstants.containerPaddingCoef,
                        renderParams.grid.yStep * renderParams.layout.Size - 2 * renderParams.grid.yStep * BMA.SVGRendering.SVGRenderingConstants.containerPaddingCoef,
                        0,
                        0,
                        {
                            stroke: "none",
                            fill: renderParams.background !== undefined ? renderParams.background : "none",
                        });

                    var scale = 0.52 * renderParams.layout.Size;

                    var cellPath = jqSvg.createPath();
                    var pathFill = "#d0e9f0";
                    var selectedPathFill = '#62b9d1';

                    if ((<any>window).VisualSettings !== undefined && (<any>window).VisualSettings.IsOldColorSchemeEnabled) {
                        pathFill = "#faaf40";
                        selectedPathFill = "gray";
                    }

                    if (renderParams.isHighlighted !== undefined && !renderParams.isHighlighted) {
                        pathFill = "#EDEDED";
                    }

                    var op = jqSvg.path(g, cellPath, {
                        stroke: renderParams.isSelected ? selectedPathFill : pathFill,
                        strokeWidth: 2,
                        fill: pathFill,
                        "fill-rule": "evenodd",
                        d: that.cellData,
                        transform: "scale(" + scale + ") translate(-640, -487)"
                    });

                    if (renderParams.translate === undefined) {

                        var xThickness = BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseWidth - BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth;
                        var yThickness = BMA.SVGRendering.SVGRenderingConstants.containerOuterEllipseHeight - BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight;

                        jqSvg.ellipse(g,
                            BMA.SVGRendering.SVGRenderingConstants.containerInnerCenterOffset * renderParams.layout.Size,
                            0,
                            BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseWidth * renderParams.layout.Size + xThickness * (renderParams.layout.Size - 1),
                            BMA.SVGRendering.SVGRenderingConstants.containerInnerEllipseHeight * renderParams.layout.Size + yThickness * (renderParams.layout.Size - 1), { stroke: "none", fill: "white" });

                        //Test geometry for container outer ellipse check
                        //jqSvg.ellipse(g,
                        //    containerOuterCenterOffset * renderParams.layout.Size,
                        //    0,
                        //    containerOuterEllipseWidth * renderParams.layout.Size,
                        //    containerOuterEllipseHeight * renderParams.layout.Size, { stroke: "red", fill: "none" });

                        //jqSvg.ellipse(g,
                        //    0,
                        //    0,
                        //    113 * renderParams.layout.Size,
                        //    130 * renderParams.layout.Size, { stroke: "red", fill: "none" });

                        //if (that.labelVisibility === true) {
                        //    if (renderParams.layout.Name !== undefined && renderParams.layout.Name !== "") {
                        //        var textLabel = jqSvg.text(g, 0, 0, renderParams.layout.Name, {
                        //            transform: "translate(" + -(renderParams.layout.Size * renderParams.grid.xStep / 2 - 10 * renderParams.layout.Size) + ", " + -(renderParams.layout.Size * renderParams.grid.yStep / 2 - that.labelSize - 10 * renderParams.layout.Size) + ")",
                        //            "font-size": that.labelSize * renderParams.layout.Size,
                        //            "font-family": textFontFamily,
                        //            "src": textFontSrc,
                        //            "fill": "black"
                        //        });
                        //    }
                        //}
                    }
                } else {
                    if (renderParams.translate === undefined && that.LabelVisibility === true) {
                        if (renderParams.layout.Name !== undefined && renderParams.layout.Name !== "") {
                            var textLabel = jqSvg.text(g, 0, 0, renderParams.layout.Name, {
                                transform: "translate(" + -(renderParams.layout.Size * renderParams.grid.xStep / 2 - 10 * renderParams.layout.Size) + ", " + -(renderParams.layout.Size * renderParams.grid.yStep / 2 - that.LabelSize - 10 * renderParams.layout.Size) + ")",
                                "font-size": that.LabelSize * renderParams.layout.Size,
                                "font-family": BMA.SVGRendering.SVGRenderingConstants.textFontFamily,
                                "src": BMA.SVGRendering.SVGRenderingConstants.textFontSrc,
                                "fill": "black"
                            });
                        }
                    }
                }

                //$(op).attr("onmouseover", "BMA.SVGHelper.AddClass(this, 'modeldesigner-element-hover')");
                //$(op).attr("onmouseout", "BMA.SVGHelper.RemoveClass(this, 'modeldesigner-element-hover')");

                /*
                //Helper bounding ellipses
                jqSvg.ellipse(
                    (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + containerOuterCenterOffset * renderParams.layout.Size + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2,
                    (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2,
                    containerOuterEllipseWidth * renderParams.layout.Size, containerOuterEllipseHeight * renderParams.layout.Size, { stroke: "red", fill: "none" });
                
                jqSvg.ellipse(
                    (renderParams.layout.PositionX + 0.5) * renderParams.grid.xStep + containerInnerCenterOffset * renderParams.layout.Size + (renderParams.layout.Size - 1) * renderParams.grid.xStep / 2,
                    (renderParams.layout.PositionY + 0.5) * renderParams.grid.yStep + (renderParams.layout.Size - 1) * renderParams.grid.yStep / 2,
                    containerInnerEllipseWidth * renderParams.layout.Size, containerInnerEllipseHeight * renderParams.layout.Size, { stroke: "red", fill: "none" });

                jqSvg.ellipse(
                    x + containerOuterCenterOffset * renderParams.layout.Size / 2,
                    y,
                    (containerInnerEllipseWidth + containerOuterEllipseWidth) * renderParams.layout.Size / 2,
                    (containerInnerEllipseHeight + containerOuterEllipseHeight) * renderParams.layout.Size / 2,
                    { stroke: "red", fill: "none" });
                */

                var svgElem: any = $(jqSvg.toSVG()).children();
                return <SVGElement>svgElem;
            }

            public GetIconSVG(iconFill: string): string {
                return undefined;
            }
        }
    }
}