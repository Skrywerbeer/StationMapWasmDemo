import Map from "/JS/node_modules/ol/Map.js";
import View from "/JS/node_modules/ol/View.js";
import OSM from "/JS/node_modules/ol/source/OSM.js";
import TileLayer from "/JS/node_modules/ol/layer/Tile.js";

import Style from "/JS/node_modules/ol/style/Style.js";
import Text from "/JS/node_modules/ol/style/Text.js";
import Fill from "/JS/node_modules/ol/style/Fill.js";
import Stroke from "/JS/node_modules/ol/style/Stroke.js";
import Circle from "/JS/node_modules/ol/style/Circle.js";
import RegularShape from "/JS/node_modules/ol/style/RegularShape.js";
import Icon from "/JS/node_modules/ol/style/Icon.js";

import GeoJSON from "/JS/node_modules/ol/format/GeoJSON.js";
import VectorLayer from "/JS/node_modules/ol/layer/Vector.js";
import VectorSource from "/JS/node_modules/ol/source/Vector.js";

import * as olUtil from "/JS/node_modules/ol/util.js";

// key:value int:Feature 
const featuresMap = new Map();
// key:value string:VectorLayer
const layersMap = new Map();

const map = new Map({
    target: "map",
    layers: [new TileLayer({source: new OSM()})],
    controls: [],
    view: new View({
        projection: "EPSG:4326",
        center: [28, -27],
        zoom: 7
    })
});

function getLayerByName(name) {
    return layersMap.get(name);
}

export function addFeature(layerName, geoJson) {
    let feature = (new GeoJSON).readFeature(geoJson);
    const layer = getLayerByName(layerName);
    if (layer)
        layer.getSource().addFeature(feature);
    const uid = olUtil.getUid(feature);
    featuresMap.set(uid, feature);
    return Number(uid);
}

export function removeFeature(layerName, uid) {
    const layer = getLayerByName(layerName);
    if (layer) {
        const feature = featuresMap.get(uid);
        if (!feature)
            throw new Error(`Could not find the feature with uid: ${uid}`);
        layer.getSource().removeFeature(feature);
        featuresMap.delete(uid);
    }
    else {
        throw new Error(`Could not find the layer: ${layerName}`);
    }
}

export function addFeatureCollection(layerName, geoJson) {
    const layer = getLayerByName(layerName);
    if (layer) {
        const features = (new GeoJSON).readFeatures(geoJson);
        const uids = new Array();
        for (const feature of features) {
            const uid = Number(olUtil.getUid(feature)); 
            featuresMap.set(uid, feature);
            uids.push(uid);
        }
        layer.getSource().addFeatures(features);
        return uids;
    }
    else {
        throw new Error(`Could not find layer: ${layerName}`);
    }
}

export function addLayer(layer) {
    let vectorLayer;
    console.log(layer);
    if (layer.style) {
        console.log(layer)
        const style = layer.style;
        delete layer.style;
        vectorLayer = new VectorLayer(layer);
        vectorLayer.setStyle(new Style());
        
        if (style.image) {
            console.log(style.image);
            vectorLayer.getStyle().setImage(createImageObject(style.image));
        }
        if (style.fill) {
            console.log(createFillObject(style.fill));
            vectorLayer.getStyle().setFill(createFillObject(style.fill));
        }
        if (style.stroke) {
            console.log(createStrokeObject(style.stroke));
            vectorLayer.getStyle().setStroke(createStrokeObject(style.stroke));
        }
        if (style.text) {
            console.log(createTextObject(style.text));
            vectorLayer.getStyle().setText(createTextObject(style.text));
        }
    }
    else {
        vectorLayer = new VectorLayer(layer);
    }
    vectorLayer.setSource(new VectorSource());
    console.log(layer.name);
    layersMap.set(layer.name, vectorLayer)
    map.addLayer(vectorLayer);
}

export function removeLayer(name) {
    const layer = getLayerByName(name);
    if (layer) {
        map.removeLayer(layer);
        layersMap.delete(name);
    }
}

function createImageObject(imageOptions) {
    if (imageOptions.fill)
        imageOptions.fill = new Fill(imageOptions.fill);
    if (imageOptions.stroke) {
        imageOptions.stroke = new Stroke(imageOptions.stroke);
    }
    // If src is defined then imageOptions is for an Icon.
    if (imageOptions.src) {
        return new Icon(imageOptions);
    }
    // If just radius and not radius2 is defined then imageOptions is for a Circle.
    if (imageOptions.radius && !imageOptions.radius2) {
        return new Circle(imageOptions);
    }
    // If both radius and radius2 is defined then imageOptions is for a RegularShape.
    if (imageOptions.radius && imageOptions.radius2) {
        return new RegularShape(imageOptions);
    }
    
}

function createFillObject(fillOptions) {
    return  new Fill(fillOptions);
}

function createStrokeObject(strokeOptions) {
    return new Stroke(strokeOptions);
}

function createTextObject(textOptions) {
    let fillOptions = null;
    if (textOptions.fill) {
        fillOptions = textOptions.fill
        delete textOptions.fill;
    }
    let strokeOptions = null;
    if (textOptions.stroke) {
        strokeOptions = textOptions.stroke;
        delete textOptions.stroke;
    }
    const text = new Text(textOptions);
    if (fillOptions)
        text.setFill(new Fill(fillOptions));
    return text;
}

export function centerOn(coordinate) {
    if (!coordinate)
        throw new Error("Argument required for function centerOn(coordinate)");
    map.getView().setCenter(coordinate);
    
}

export function setZoom(level) {
    map.getView().setZoom(level);
}