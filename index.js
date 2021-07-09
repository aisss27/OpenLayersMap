import 'ol/ol.css';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import View from 'ol/View';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Vector as VectorLayer } from 'ol/layer';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import { click,pointerMove   } from 'ol/events/condition';


var raster = new TileLayer({
  source: new OSM(),
  visible: false
});

var source = new VectorSource({ wrapX: false });

var vector = new VectorLayer({
  source: source,
  visible: false
});

let baseLayers = [];
let vectorLayers = [];

let vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'https://kazmap.kz/geoserver/wfs?service=WFS&' +
      'version=1.1.0&request=GetFeature&typename=nur-sultan:v_buildings_a&' +
      'outputFormat=application/json&srsname=EPSG:3857&' +
      'bbox=' +
      extent.join(',') +
      ',' + 'EPSG:3857'
    );
  },
  strategy: bboxStrategy,
});



let vectorSource2 = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'https://kazmap.kz/geoserver/wfs?service=WFS&' +
      'version=1.1.0&request=GetFeature&typename=nur-sultan:v_roads_l&' +
      'outputFormat=application/json&srsname=EPSG:3857&' +
      'bbox=' +
      extent.join(',') +
      ',' + 'EPSG:3857'
    );
  },
  strategy: bboxStrategy,
});


let baseLayer1 = new TileLayer({
  source: new TileWMS({
    url: 'http://kazmap.kz/geoserver/wms',
    params: { 'LAYERS': 'nur-sultan:nur-sultan-base', 'TILED': true },
    serverType: 'geoserver',

    // Countries have transparency, so do not fade tiles:
  }),
  visible: true,
});

let baseLayer2 = new TileLayer({
  source: new TileWMS({
    url: 'https://kazmap.kz/geoserver/wms',
    params: { 'LAYERS': 'nur-sultan:astana', 'TILED': true },
    serverType: 'geoserver',
    // Countries have transparency, so do not fade tiles:
  }),
  visible: false,
});

var customStyleFunction = function (feature) {
  let fillColor
console.log(feature)
  if (feature.get('material') === 'каменное') {
    fillColor = 'rgba(0, 0, 80, 0.7)';
    return [new Style({
      fill: new Fill({
        color: fillColor
      }),
    })];
  }
  return;
};

let vectorLayer1 = new VectorLayer({
  source: vectorSource,
  visible: true,
  style: customStyleFunction,
});


let vectorLayer2 = new VectorLayer({
  visible: false,
  source: vectorSource2,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 0.7)',
      width: 4,
    }),
  }),
});
baseLayers.push(baseLayer1);
baseLayers.push(baseLayer2);
vectorLayers.push(vectorLayer1);
vectorLayers.push(vectorLayer2);
baseLayers.push(raster);

baseLayer1.set('name', 'Базовая карта')
baseLayer2.set('name', 'Аэроснимки')
baseLayer1.set('isBaselayer', true)
baseLayer2.set('isBaselayer', true)

vector.set('name', 'Draw')

raster.set('name', 'OSM')
raster.set('isBaselayer', true)

vectorLayer1.set('name', 'Здания')
vectorLayer2.set('name', 'Дороги')
vectorLayer1.set('isVectorlayer', true)
vectorLayer2.set('isVectorlayer', true)

let map = new Map({
  layers: [baseLayer1, baseLayer2, vectorLayer1, vectorLayer2, raster, vector],
  target: 'map',
  view: new View({
    center: [7950868, 6645524],
    zoom: 18,
  }),
});

let layersArr = map.getLayers(baseLayers).getArray();
console.log(layersArr)


let baseList = document.getElementById('baseLayers-list');
let vectorList = document.getElementById('vectorLayers-list');

//Adding checkboxes and radio buttons to li

for (let i = 0; i < layersArr.length; i++) {
  if (layersArr[i].get('isBaselayer')) {
    let li = document.createElement('li');
    li.innerHTML = layersArr[i].get('name')
    baseList.appendChild(li);
    var radioButton = document.createElement('input');
    radioButton.type = "radio";
    radioButton.name = 'baselayers'
    if (layersArr[i].getVisible()) { radioButton.checked = true }
    radioButton.value = layersArr[i].get('name')
    li.appendChild(radioButton);
    radioButton.addEventListener('click', function () {
      baseLayers.forEach(function (layer) {
        layer.setVisible(false)
      })
      layersArr[i].setVisible(!layersArr[i].getVisible());
    });
  } else {
    let li2 = document.createElement('li');
    li2.innerHTML = layersArr[i].get('name')
    vectorList.appendChild(li2);
    var checkBox = document.createElement('input');
    checkBox.type = "checkbox";
    checkBox.name = layersArr[i].get('name')
    li2.appendChild(checkBox);
    checkBox.addEventListener('change', function () {
      layersArr[i].setVisible(!layersArr[i].getVisible());   
       });
  }
}



//Draw 

var ExampleModify = {
  init: function () {
    this.select = new Select();
    map.addInteraction(this.select);

    this.modify = new Modify({
      features: this.select.getFeatures(),
    });
    map.addInteraction(this.modify);

    this.setEvents();
  },
  setEvents: function () {
    var selectedFeatures = this.select.getFeatures();

    this.select.on('change:passive', function () {
      selectedFeatures.forEach(function (each) {
        selectedFeatures.remove(each);
      });
    });
  },
  setActive: function (active) {
    this.select.setActive(active);
    this.modify.setActive(active);
  },
};
ExampleModify.init();

var optionsForm = document.getElementById('options-form');

var ExampleDraw = {
  init: function () {
    map.addInteraction(this.Point);
    this.Point.setActive(false);
    map.addInteraction(this.LineString);
    this.LineString.setActive(false);
    map.addInteraction(this.Polygon);
    this.Polygon.setActive(false);
    map.addInteraction(this.Circle);
    this.Circle.setActive(false);
  },
  Point: new Draw({
    source: vector.getSource(),
    type: 'Point',
  }),
  LineString: new Draw({
    source: vector.getSource(),
    type: 'LineString',
  }),
  Polygon: new Draw({
    source: vector.getSource(),
    type: 'Polygon',
  }),
  Circle: new Draw({
    source: vector.getSource(),
    type: 'Circle',
  }),
  getActive: function () {
    return this.activeType ? this[this.activeType].getActive() : false;
  },
  setActive: function (active) {
    var type = optionsForm.elements['draw-type'].value;
    if (active) {
      this.activeType && this[this.activeType].setActive(false);
      this[type].setActive(true);
      this.activeType = type;
    } else {
      this.activeType && this[this.activeType].setActive(false);
      this.activeType = null;
    }
  },
};
ExampleDraw.init();

/**
 * Let user change the geometry type.
 * @param {Event} e Change event.
 */
optionsForm.onchange = function (e) {
  var type = e.target.getAttribute('name');
  var value = e.target.value;
  if (type == 'draw-type') {
    ExampleDraw.getActive() && ExampleDraw.setActive(true);
  } else if (type == 'interaction') {
    if (value == 'modify') {
      ExampleDraw.setActive(false);
      ExampleModify.setActive(true);
    } else if (value == 'draw') {
      ExampleDraw.setActive(true);
      ExampleModify.setActive(false);
    }
  }
};

ExampleDraw.setActive(false);
ExampleModify.setActive(false);

// The snap interaction must be added after the Modify and Draw interactions
// in order for its map browser event handlers to be fired first. Its handlers
// are responsible of doing the snapping.
var snap = new Snap({
  source: vector.getSource(),
});
map.addInteraction(snap);


//Select with pop-up

var select = null; // ref to currently selected interaction

// select interaction working on "singleclick"
var selectSingleClick = new Select();


var selectElement = document.getElementById('type');

var changeInteraction = function () {
  var value = 'singleclick';
    select = selectSingleClick;
  map.addInteraction(select);
    select.on('select', function (e) {
      document.getElementById('status').innerHTML =
        '&nbsp;'
    });
};

/**
 * onchange callback on the select element.
 */
selectElement.onchange = changeInteraction;
changeInteraction();

let properties = [
  {
    value_en: 'material',
    value_ru: 'материал'
  }
];
let ul = document.createElement('ul');

for(let i = 0; i < texts.length; i++){
  feature.get(properties[i].value_en);
  let li = document.createElement('li');
  ul.appendChild(li);
}

var info = document.getElementById('info');
var target = document.getElementById('map');


function displayFeatureInfo(pixel) {
        info.style.left = pixel[0] + 'px';
        info.style.top = (pixel[1] - 50) + 'px';
        var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return feature;
        });
        if (feature) {
          console.log(feature) 
          var text = 'материал: '  + feature.get('material') + ', ' + feature.get('usage');
            info.style.display = 'none';
            info.innerHTML = text;
            info.style.display = 'block';
            target.style.cursor = "pointer";
        } else {
            info.style.display = 'none';      
            target.style.cursor = "";
        }
    }


map.on('click', function(evt) {
        if (evt.dragging) {
            info.style.display = 'none';
            return;
        }
        var pixel = map.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
});
