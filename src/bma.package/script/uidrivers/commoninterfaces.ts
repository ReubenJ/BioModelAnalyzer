// Copyright (c) Microsoft Research 2016
// License: MIT. See LICENSE
/// <reference path="..\..\Scripts\typings\jquery\jquery.d.ts"/>
/// <reference path="..\..\Scripts\typings\jqueryui\jqueryui.d.ts"/>

module BMA {
    export module UIDrivers {
        export interface ISVGPlot {
            Draw(svg: SVGElement);
            DrawLayer2(svg: SVGElement);
            DrawRects(rects: { x: number, y: number, width: number, height: number, fill: string }[])
            SetGrid(x0: number, y0: number, xStep: number, yStep: number);
            GetPlotX(left: number);
            GetPlotY(top: number);
            GetLeft(x: number);
            GetTop(y: number);
            GetPixelWidth();
            SetGridVisibility(isOn: boolean);
            SetVisibleRect(rect: { x: number; y: number; width: number; height: number });
            GetSVG(): string;
            GetSVGRef(): any;
            GetLightSVGRef(): any;
            SetConstraintFunc(constraint: Function);
            SetConstraints(minWidth: number, maxWidth: number, minHeight: number, maxHeight: number);
        }

        export interface IHider {
            Hide();
            HideTab(index);
            ContentLoaded(index, value);
        }

        export interface INavigationPanel {
            GetNavigationSurface(): any; //TODO: add proper type here
            TurnNavigation(isOn: boolean);
            SetZoom(zoom: number);
            SetCenter(x: number, y: number);
            MoveDraggableOnTop();
            MoveDraggableOnBottom();
        }

        export interface IServiceDriver {
            Invoke(data): JQueryPromise<any>;
        }

        export interface IExportService {
            Export(content: string, name: string, extension: string)
        }

        export interface IVariableEditor {
            GetVariableProperties(): {
                name: string; formula: string; rangeFrom: number; rangeTo: number; TFdescription: string;
            };
            Initialize(variable: BMA.Model.Variable, model: BMA.Model.BioModel, layout: BMA.Model.Layout);
            Show(x: number, y: number);
            Hide();
            IsVisible(): boolean;
            SetValidation(val: boolean, message: string);
            SetOnClosingCallback(callback: Function);
            SetOnVariableEditedCallback(callback: Function);
            SetOnFormulaEditedCallback(callback: Function);
        }

        export interface IContainerEditor {
            GetContainerName(): string;
            Initialize(containerLayout: BMA.Model.ContainerLayout);
            Show(x: number, y: number);
            Hide();
            SetOnClosingCallback(callback: Function);
        }

        export interface IElementsPanel {
            GetDragSubject(): any;
            GetMouseMoves(): any;
        }

        export interface ITurnableButton {
            Turn(isOn: boolean);
        }

        export interface IProcessLauncher {

        }

        export interface IPopup {
            Seen();
            Show(params);
            Hide();
        }


        export interface IProofResultViewer {
            ShowResult(result: BMA.Model.ProofResult);
            SetData(params);
            OnProofStarted();
            OnProofFailed();
            Show(params);
            Hide(params);
        }

        export interface IFurtherTesting {
            ShowStartFurtherTestingToggler();
            HideStartFurtherTestingToggler();
            ShowResults(data);
            HideResults();
            GetViewer();
            StandbyMode();
            ActiveMode();
        }

        export interface ISimulationViewer {
            SetData(params);
            Show(params);
            Hide(params);
            ChangeVisibility(params);
        }

        export interface ISimulationExpanded {
            AddResult(res);
            SetNumberOfSteps(num);
            GetViewer();
            Set(data);
            SetData(data);
            StandbyMode();
            ActiveMode();
            SetOnPlotVariablesSelectionChanged(callback);
            SetOnCreateStateRequested(callback);
        }

        export interface ILocalStorageDriver {
            SetItems(keys);
            AddItem(key, item);
            //Show();
            //Hide();
            Message(msg: string);
            SetActiveModel(key);
            SetOnUnselect();
            SetOnEnableContextMenu(enable: boolean);
            SetOnRequestLoadModel(callback: Function);
            SetOnRemoveModel(callback: Function);
            SetOnCopyToOneDriveCallback(callback: Function);
        }

        export interface IOneDriveDriver {
            SetItems(keys);
            AddItem(key, item);
            //Show();
            //Hide();
            Message(msg: string);
            SetActiveModel(key);
            SetOnUnselect();
            SetOnLoading(flag: boolean);
            SetOnRequestLoadModel(callback: Function);
            SetOnRemoveModel(callback: Function);
            SetOnCopyToLocalCallback(callback: Function);
            SetOnShareCallback(callback: Function);
            SetOnActiveShareCallback(callback: Function);
            SetOnOpenBMALink(callback: Function);
        }

        export interface IModelStorageDriver {
            Show();
            Hide();
            SetAuthorizationStatus(status: boolean);
            SetOnUpdateModelList(callback: Function);
            SetLinkToModelByName(callback: Function); //For local loading
            SetLinkToModelByInfo(callback: Function); //For OneDrive loading
            SetLoadModelRequest(callback: Function);
            //SetOnSignInCallback(callback: Function);
            //SetOnSignOutCallback(callback: Function);
        }

        export interface IFileLoader {
            OpenFileDialog(): JQueryPromise<File>;
        }

        export interface IContextMenu {
            GetMenuItems(): string[];
            EnableMenuItems(optionsVisibility: { name: string; isEnabled: boolean }[]): void;
            ShowMenuItems(optionsVisibility: { name: string; isVisible: boolean }[]): void;
        }

        export interface IAreaHightlighter {
            HighlightAreas(areas: { x: number; y: number; width: number; height: number; fill: string}[]);
        }



        export interface ModelInfo {
            id: string;
            name: string;
        }

        export interface IModelRepository {
            GetModelList(): JQueryPromise<string[]>;
            GetModels(): JQueryPromise<JSON[]>;
            LoadModel(id: string): JQueryPromise<JSON>;
            RemoveModel(id: string);
            SaveModel(id: string, model: JSON);
            IsInRepo(id: string);
            
            //OnRepositoryUpdated();
        }

        export interface IMessageServiсe {
            Show(message: string);
            Log(message: string);
        }

        export interface ICheckChanges {
            Snapshot(model);
            IsChanged(model);
        }

        export interface IWaitScreen {
            Show();
            Hide();
        }

        export interface IDragnDropExtender {
            HandleDrop(screenLocation: { x: number; y: number }, dropObject: any): boolean;
        }
       
    }
} 
