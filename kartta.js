// Kartta-rajapinta ja luontokohteiden haku

'use strict';
const apikey = '7a9779f6-ef52-49a5-a098-fa530e537e28';
let map;
let controller = new AbortController();
let signal = controller.signal;
let kohdeMarkkeri;
let sijaintiMarkkeri;

// Haetaan sijainti ja kutsutaan haeKartta-funktiota
navigator.geolocation.getCurrentPosition(success, error);
function success(pos) {
  let latitude = pos.coords.latitude;
  let longitude = pos.coords.longitude;
  haeKartta(latitude, longitude);
}
// Jos sijaintia ei saada, käytetään Karamalmin koordinaatteja
function error(err) {
  haeKartta(60.2236,24.7582);
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

// Haetaan kartta sijainnin perusteella
function haeKartta(latitude, longitude) {
  map = new mapboxgl.Map({
    container: 'map',
    hash: true,
    style: `https://avoin-karttakuva.maanmittauslaitos.fi/vectortiles/stylejson/v20/hobby.json?api-key=${apikey}`,
    center: [longitude, latitude],
    zoom: 13.81,
  });
  // zoomi ja rotaatio
  map.addControl(new mapboxgl.NavigationControl());
  // Lokaation seuranta
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
  }));
  // Sijoitetaan markkeri kartalle
  sijaintiMarkkeri = teeMarkkeri(latitude,longitude,"#940303").addTo(map);;

}

// Markkeri
function teeMarkkeri(latitude, longitude, color) {
  const marker = new mapboxgl.Marker({
    color: color
  });
  marker.setLngLat([longitude, latitude]);
  return marker;
}

// Paikannus-nappi
document.querySelector('#paikanna').addEventListener('click', function() {
  navigator.geolocation.getCurrentPosition(flyToLocation, flyHome);
  function flyToLocation(pos) {
    map.flyTo({center: [pos.coords.longitude, pos.coords.latitude]});
  }
  function flyHome() {
    map.flyTo({center: [60.2236, 24.7582]});
  }
});

// Hakukenttä
document.querySelector('#paikkahakuLomake').addEventListener('submit', function() {
  let hakuteksti = document.querySelector('#paikkahakukentta').value;
  if (controller) {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
  }
  haeKohteet(hakuteksti);
});

// Tyhjennä haku -nappi
document.querySelector('#reset').addEventListener('click', function() {
  document.querySelector('#paikkahakukentta').value = '';
  if (controller) {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
  }
  // Poistetaan kohteen markkeri
  kohdeMarkkeri.remove();
  haeKohteet();
});

// Siirtyminen valittuun hakukohteeseen
function geocoding_click(e) {
  let eDataset = e.target.dataset
  let coord = [eDataset.geocodingResultPointLon, eDataset.geocodingResultPointLat];
  kohdeMarkkeri = teeMarkkeri(eDataset.geocodingResultPointLat, eDataset.geocodingResultPointLon, '#85955F').addTo(map);
  map.flyTo({center: coord});
}

// Kartalle lisääminen
function lisaaKartalle(json) {
  if (!map.getSource('point')) {
    return;
  }
  map.getSource('point').setData(json);
}

// Hakulistan tyhjentäminen
function tyhjennaLista(lista) {
  while (lista.firstChild) {
    lista.firstChild.removeEventListener(lista.firstChild, geocoding_click);
    lista.firstChild.remove();
  }
}

// Listan päivitys
function geocoding_update_list(listEl, list, f) {
  list.map(f).forEach(el => {
    listEl.appendChild(el)
    el.addEventListener('click', geocoding_click);
  });
}

// Hakutoiminto
function haeKohteet(text, resetList) {
  let listEl = document.getElementById('paikkahakutulokset');

  if (!text || text == '') {
    tyhjennaLista(listEl);
    return;
  } else if (resetList) {
    tyhjennaLista(listEl);
  }

  // Url-osoite parametreineen
  let url = 'https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v1/pelias/search?api-key=' +
      apikey + '&'
      + new URLSearchParams({
        lang: 'fin',
        crs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
        size: 10,
        text: text
      });

  fetch(url, {
    method: 'get',
    signal: signal
  }).then(response => response.json()).then(json => {
    lisaaKartalle(json);
    tyhjennaLista(listEl);
    // Haettavat ominaisuudet
    let arr = json.features ? json.features.map(a => {
      let labelText = a.properties.label,
          labelInfoText = [
            a.properties['label:municipality'],
            a.properties['label:region'],
            a.properties['label:placeType']
          ].join(' / ');

      return {
        text: labelText,
        info: labelInfoText,
        location: a.geometry.coordinates
      };
    }) : [];

    geocoding_update_list(listEl, arr, res => {
      let el = document.createElement('div');

      let elLink = document.createElement('a');
      elLink.classList.add('paikkahakutulos');
      elLink.innerHTML = res.text;

      let attrs = {
        'href': 'javascript:void(0)',
        'data-geocoding-type': 'result',
        'data-geocoding-result-text': res.text,
        'data-geocoding-result-point-lon': res.location[0],
        'data-geocoding-result-point-lat': res.location[1]
      };
      for (let [key, value] of Object.entries(attrs)) {
        elLink.setAttribute(key, value)
      }
      el.appendChild(elLink);
      let elInfo = document.createElement('span');
      elInfo.classList.add('paikka');
      elInfo.innerHTML = res.info;
      el.appendChild(elInfo);

      return el;
    });
  }).catch(function(err) {
    tyhjennaLista(listEl);
  });
}



// Luontokohteiden haku kartalle
// (Tämä jäi hieman kesken ajanpuutteen vuoksi, joten ihan koko rajapinta ei ole käytössä.)
function haeLuontokohteet() {
  let url = 'https://citynature.eu/api/wp/v2/places?cityid=5'

  fetch(url, {
    method: 'get',
    signal: signal
  }).then(function (vastaus) {
    return vastaus.json();
  })
  .then(function (tulokset) {
    console.log(tulokset);
    const kaikkiKohteet = [];
    tulokset.forEach(function (tulos) {
      tulos.points.map(function (point) {
        let rasti = {
          type: 'Feature',
          properties: {
            name: tulos.title,
            popupContent: point.locationPoint.pointInfo,
          },
          geometry: {
            type: 'Point',
            coordinates: [point.locationPoint.lng, point.locationPoint.lat],
          },
        };
        kaikkiKohteet.push(rasti);
        return rasti;
      });
    });
    map.addSource('places', {
      type:'geojson',
      data: {
        "type": "FeatureCollection",
        "features": kaikkiKohteet
      }
    });

    // Lisätään karttaan layeri
    map.addLayer({
      'id': 'places',
      'source': 'places',
      'type': 'circle',
      'paint': {'circle-color': '#426A5A',
        'circle-radius': 10,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#f1f1f1',
      }
    });
    map.on('click', 'places', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.popupContent;
      const name = e.features[0].properties.name;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      // Luodaan popup annetuilla tiedoilla
      new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML('<h3>' + name + '</h3>')
      .setHTML('<p>' + description + '</p>')
      .addTo(map);
    });

    // Hover cursori
    map.on('mouseenter', 'places', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'places', () => {
      map.getCanvas().style.cursor = '';
    });

  });
}

haeLuontokohteet();





