// Laji.fi-rajapinnan scripti

'use strict';
const lomake = document.querySelector('#lajihakuForm');
const hakukentta = lomake.querySelector('#hakuteksti');
const hakuElementti = document.querySelector('#hakutulokset');

// Hakutoiminto
lomake.addEventListener('submit', function(evt) {
  evt.preventDefault();
  const apiOsoite = lomake.action;
  const haettava = hakukentta.value;
  const token = "access_token=MVYBm4awbkqmbCMwaw1Evac8sAy7DLgJppHxQ4qXf9XeOZ8MDomcHjlTsGD51Dgd"

  // Tyhjennetään sivusto
  hakuElementti.innerHTML= "";

    // Haetaan syötetyn merkkijonon perusteella
    fetch(
        `${apiOsoite}taxa/search?query=${haettava}&limit=10&onlySpecies=true&onlyFinnish=true&observationMode=false&${token}`).
        then(function(vastaus) {
          return vastaus.json();
        }).
        then(function(hakutulokset) {

          if (hakutulokset.length > 0) {
          // Loopataan palautettu taulukko läpi ja kerätään halutut tiedot
          for (let i = 0; i < hakutulokset.length; i++) {
            const article = document.createElement('article');
            article.className = "hakutulos";
            const nimi = document.createElement('h3');
            nimi.className = 'collapsHeader';
            const collapsible = document.createElement('div');      // Elementin sisään laitetaan piilotettavat tiedot
            collapsible.style.display = 'none';                     // Piilotetaan nämä
            const latin = document.createElement('p');
            const kuvaus = document.createElement('div');
            const levinneisyys = document.createElement('div');
            const tarkkaKuvaus = document.createElement('div');
            const lisatiedot = document.createElement('div');
            const kuva = document.createElement('img');
            const lightbox = document.createElement('a');
            const id = hakutulokset[i].id;

            nimi.innerHTML = capitalize(hakutulokset[i].matchingName);
            latin.innerHTML = "<em>" + hakutulokset[i].scientificName + "</em>";

            // Haetaan kuvaus, levinneisyystiedot jne id:n avulla
            fetch(
                `${apiOsoite}taxa/${id}/descriptions?langFallback=true&lang=fi&${token}`).
                then(function(vastaus) {
                  return vastaus.json();
                }).
                then(function(annaKuvaus) {
                  if (annaKuvaus.length > 0) {
                    if (annaKuvaus[0].groups[0]) {
                      kuvaus.innerHTML = "<strong>Kuvaus: </strong>" +
                          annaKuvaus[0].groups[0].variables[0].content;
                    }
                    if (annaKuvaus[0].groups[1]) {
                      levinneisyys.innerHTML = "<strong>Levinneisyys: </strong>" +
                          annaKuvaus[0].groups[1].variables[0].content;
                    }
                    if (annaKuvaus[0].groups[2]) {
                      tarkkaKuvaus.innerHTML = annaKuvaus[0].groups[2].variables[0].content;
                    }
                    if (annaKuvaus[0].groups[3]) {
                      lisatiedot.innerHTML = "<strong>" +
                          annaKuvaus[0].groups[3].variables[0].title +
                          ":</strong>" +
                          annaKuvaus[0].groups[3].variables[0].content;
                    }
                  }
                }).catch(function(error) {
              console.log(error);
            });

            // Haetaan kuva id:n avulla. Jos kuvaa ei ole, näytetään vakiokuvake
            fetch(
                `${apiOsoite}taxa/${id}/media?${token}`).
                then(function(vastaus) {
                  return vastaus.json();
                }).
                then(function(annaKuva) {
                  if (annaKuva.length > 0) {
                    kuva.src = annaKuva[0].largeURL;
                    kuva.alt = nimi.innerHTML;
                    kuva.width = 300;
                    kuva.className = "example-image";
                    lightbox.href = annaKuva[0].largeURL;
                    lightbox.className = "example-image-link";
                    lightbox.setAttribute("data-lightbox", "example-set");
                  } else {
                    kuva.src = "kuvat/kamera2_300x300px.jpg";
                    kuva.width = 200;
                    kuva.alt = "Kuvaa ei voida näyttää";
                  }
                }).catch(function(error) {
              console.log(error);
            });

            // Syötetään saatu tieto sivustolle
            hakuElementti.appendChild(article);
            article.appendChild(nimi);
            article.appendChild(collapsible);
            collapsible.appendChild(latin);
            collapsible.appendChild(lightbox);
            lightbox.appendChild(kuva);
            collapsible.appendChild(kuvaus);
            collapsible.appendChild(tarkkaKuvaus);
            collapsible.appendChild(lisatiedot);
            collapsible.appendChild(levinneisyys);

            // Nimeä klikatessa loput tiedoista tulevat esiin/menevät takaisin piiloon
            nimi.addEventListener("click", function() {
              this.classList.toggle("active");
              if (collapsible.style.display === "none") {
                collapsible.style.display = "block";
              } else {
                collapsible.style.display = "none"
              }
            });
          }
          // Jos hakutuloksia ei ole ollenkaan:
        } else {
            const article = document.createElement('article');
            article.innerHTML = "<p>Haullasi ei löytynyt tuloksia.</p>"
            hakuElementti.appendChild(article);
          }
        }).catch(function(error) {
            console.log(error);
        });


});



// Funktio muuttaa merkkijonon alkukirjaimen isoksi kirjaimeksi
function capitalize(string) {
  return string && string[0].toUpperCase() + string.slice(1);
}