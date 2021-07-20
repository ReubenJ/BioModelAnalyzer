// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

module BMA {
    export module Model {
        export class BioModel {
            private variables: Variable[];
            private relationships: Relationship[];
            private name: string;

            public get Name(): string {
                return this.name;
            }

            public set Name(value: string) {
                this.name = value;
            }

            public get Variables(): Variable[] {
                return this.variables.slice(0);
            }

            public get Relationships(): Relationship[] {
                return this.relationships.slice(0);
            }

            public Clone(): BioModel {
                return new BioModel(this.Name, this.variables.slice(0), this.relationships.slice(0));
            }

            //public SetVariableProperties(id: number, name: string, rangeFrom: number, rangeTo: number, formula: string) {
            //    for (var i = 0; i < this.variables.length; i++) {
            //        if (this.variables[i].Id === id) {
            //            this.variables[i] = new BMA.Model.Variable(
            //                this.variables[i].Id,
            //                this.variables[i].ContainerId,
            //                this.variables[i].Type,
            //                name === undefined ? this.variables[i].Name : name,
            //                isNaN(rangeFrom) ? this.variables[i].RangeFrom : rangeFrom,
            //                isNaN(rangeTo) ? this.variables[i].RangeTo : rangeTo,
            //                formula === undefined ? this.variables[i].Formula : formula);

            //            return;
            //        }
            //    }
            //}

            public GetVariableById(id: number) {
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Id === id) {
                        return this.variables[i];
                    }
                }

                return undefined;
            }

            public GetIdByName(name: string) {
                var res = [];
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Name === name) {
                        res.push(this.variables[i].Id.toString());
                    }
                }
                return res;
            }

            public GetRelationshipsForVariable(id: number): { incoming: Relationship[], outcoming: Relationship[], self: Relationship[] } {
                var result = {
                    incoming: [],
                    outcoming: [],
                    self: []
                };

                for (var i = 0; i < this.relationships.length; i++) {
                    var rel = this.relationships[i];

                    if (rel.FromVariableId === rel.ToVariableId && rel.FromVariableId === id) {
                        result.self.push(rel);
                    } else if (rel.FromVariableId === id) {
                        result.outcoming.push(rel);
                    } else if (rel.ToVariableId === id) {
                        result.incoming.push(rel);
                    }
                }

                return result;
            }

            public GetVariableNames(): string[] {
                var result = [];
                var checker = {};
                for (var i = 0; i < this.variables.length; i++) {
                    var name = this.variables[i].Name;
                    if (name !== undefined && name.length > 0 && !checker[name]) {
                        result.push(name);
                        checker[name] = true;
                    }
                }

                return result;
            }

            public GetJSON() {
                var vars = [];
                for (var i = 0; i < this.variables.length; i++) {
                    vars.push(this.variables[i].GetJSON());
                }

                var rels = [];
                for (var i = 0; i < this.relationships.length; i++) {
                    rels.push(this.relationships[i].GetJSON());
                }

                return {
                    ModelName: this.name,
                    Engine: "VMCAI",
                    Variables: vars,
                    Relationships: rels
                };
            }
           
            constructor(name: string, variables: Variable[], relationships: Relationship[]) {
                this.name = name;
                this.variables = variables;
                this.relationships = relationships;
            }
        }

        export class VariableTypes {
            public static get Default() { return "Default" } // Intracellular
            public static get Constant() { return "Constant" } // Extracellular
            public static get MembraneReceptor() { return "MembraneReceptor"; }
        }

        export class Variable {
            private id: number;
            private containerId: number;
            private type: string;
            private rangeFrom: number;
            private rangeTo: number;
            private formula: string;
            private name: string;

            public get Id(): number {
                return this.id;
            }

            public get ContainerId(): number {
                return this.containerId;
            }

            public get Type(): string {
                return this.type;
            }

            public get RangeFrom(): number {
                return this.rangeFrom;
            }

            public get RangeTo(): number {
                return this.rangeTo;
            }

            public get Formula(): string {
                return this.formula;
            }

            public get Name(): string {
                return this.name;
            }

            public GetJSON() {
                return {
                    Id: this.id,
                    Name: this.name,
                    RangeFrom: this.rangeFrom,
                    RangeTo: this.rangeTo,
                    formula: this.formula
                };
            }

            constructor(id: number, containerId: number, type: string, name: string, rangeFrom: number, rangeTo: number, formula: string) {
                this.id = id;
                this.containerId = containerId;
                this.type = type;
                this.rangeFrom = rangeFrom;
                this.rangeTo = rangeTo;
                this.formula = formula;
                this.name = name;
            }
        }

        export class RelationshipTypes {
            public static get Activator() { return "Activator"; }
            public static get Inhibitor() { return "Inhibitor"; }
        }

        export class Relationship {
            private id: number;
            private fromVariableId: number;
            private toVariableId: number;
            private type: string;

            public get Id(): number {
                return this.id;
            }

            public get FromVariableId(): number {
                return this.fromVariableId;
            }

            public get ToVariableId(): number {
                return this.toVariableId;
            }

            public get Type(): string {
                return this.type;
            }

            public GetJSON() {
                return {
                    Id: this.id, 
                    FromVariableId: this.fromVariableId,
                    ToVariableId: this.toVariableId,
                    Type: this.type
                };
            }

            constructor(id: number, fromVariableId: number, toVariableId: number, type: string) {
                this.id = id;
                this.fromVariableId = fromVariableId;
                this.toVariableId = toVariableId;
                this.type = type;
            }
        }

        export class Layout {
            private description: string;
            private variables: VariableLayout[];
            private containers: ContainerLayout[];

            public get Containers(): ContainerLayout[] {
                return this.containers.slice(0);
            }

            public get Variables(): VariableLayout[] {
                return this.variables.slice(0);
            }

            public get Description(): string {
                return this.description;
            }

            public Clone(): Layout {
                return new Layout(this.containers.slice(0), this.variables.slice(0), this.description);
            }

            public GetVariableById(id: number) {
                for (var i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].Id === id) {
                        return this.variables[i];
                    }
                }

                return undefined;
            }

            public GetContainerById(id: number) {
                for (var i = 0; i < this.containers.length; i++) {
                    if (this.containers[i].Id === id) {
                        return this.containers[i];
                    }
                }

                return undefined;
            }


            constructor(containers: ContainerLayout[], varialbes: VariableLayout[], description: string) {
                this.containers = containers;
                this.variables = varialbes;
                this.description = description;
            }
        }

        export class ContainerLayout {
            private id: number;
            private size: number;
            private positionX: number;
            private positionY: number;
            private name: string;

            public get Name(): string {
                return this.name;
            }

            //public set Name(value: string) {
            //    this.name = value;
            //}

            public get Id(): number {
                return this.id;
            }

            public get Size(): number {
                return this.size;
            }

            public get PositionX(): number {
                return this.positionX;
            }

            public get PositionY(): number {
                return this.positionY;
            }

            constructor(id: number, name: string, size: number, positionX: number, positionY: number) {
                this.id = id;
                this.name = name;
                this.size = size;
                this.positionX = positionX;
                this.positionY = positionY;
            }
        }

        export class VariableLayout {
            private id: number;
            private positionX: number;
            private positionY: number;
            private cellX: number;
            private cellY: number;
            private angle: number;
            private TFdescription: string;
            private fill: string;
            private stroke: string;

            public get Id(): number {
                return this.id;
            }

            public get PositionX(): number {
                return this.positionX;
            }

            public get PositionY(): number {
                return this.positionY;
            }

            public get CellX(): number {
                return this.cellX;
            }

            public get CellY(): number {
                return this.cellY;
            }

            public get Angle(): number {
                return this.angle;
            }

            public get TFDescription(): string {
                return this.TFdescription ? this.TFdescription : "";
            }

            public get Fill(): string {
                return this.fill;
            }

            public get Stroke(): string {
                return this.stroke;
            }

            constructor(id: number, positionX: number, positionY: number, cellX: number, cellY: number, angle: number, TFdescription: string = "", stroke: string, fill: string) {
                this.id = id;
                this.positionX = positionX;
                this.positionY = positionY;
                this.cellX = cellX;
                this.cellY = cellY;
                this.angle = angle;
                this.TFdescription = TFdescription;
                this.stroke = stroke;
                this.fill = fill;
            }
        }

        export function GenerateNewContainerName(containerLayouts: ContainerLayout[]): string {
            var prefix = "C";
            var index = 0;
            while (true) {
                var name = prefix + index;
                var matchFound = false

                for (var i = 0; i < containerLayouts.length; i++) {
                    if (containerLayouts[i].Name === name) {
                        matchFound = true;
                        continue;
                    }
                }

                if (matchFound) {
                    index++;
                    continue;
                } else
                    return name;
            }
        }
    }
} 
