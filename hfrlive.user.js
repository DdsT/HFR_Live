// ==UserScript==
// @name           [HFR] Live mod DdsT
// @namespace      ddst.github.io
// @version        0.1.8
// @description    Vérifie périodiquement l'existence de nouveau messages et les ajoute à la page
// @author         DdsT
// @originalAuthor psykhi
// @URL            https://ddst.github.io/HFR_Live/
// @downloadURL    https://ddst.github.io/HFR_Live/hfrlive.user.js
// @updateURL      https://ddst.github.io/HFR_Live/hfrlive.meta.js
// @icon           https://forum.hardware.fr/favicon.ico
// @match          *://forum.hardware.fr/forum2.php*
// @match          *://forum.hardware.fr/hfr/*/*sujet_*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @require        https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addStyle
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.deleteValue
// ==/UserScript==

/*
Copyright (C) 2019 DdsT

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see https://ddst.github.io/hfr_ColorTag/LICENSE.
*/

/************** TODO *****************
 * Gérer les cas de suppression de message
 * Indicateur de nouveau message privé
 * Fenêtre de configuration
 * Beta-test
 * Test de compatibilité multi-navigateur
 * Retirer les alertes de debogage
 *************************************/

/*** Paramètres du script ***/
let config = {
  fetchInterval   : 4000, // Intervalle entre chaque requête (ne pas descendre trop bas sous peine de ban IP)
  contextMenu     : true, // Le script peut être piloté depuis le menu contextuel (au 12/2018 : Firefox uniquement)
  changePage      : true, // Le script passe automatiquement à la page suivante
  pageAmount      : 10,   // Nombre de pages à combiner avant de changer de page
  changePageDelay : 2000, // Temporisation avant le changement de page
  // Paramètres d'affichage
  messageInterval : 500,   // Intervalle minimum entre l'apparition de 2 messages sur la page
  fadeInTime      : 1000,  // Durée de l'animation d'apparition d'un message
  legacyButton    : false, // Le bouton du script d'origine est utilisé
  colorBlind      : false, // Le mode daltonien est activé (bleu à la place du vert)
  control         : true,  // Un panneau de contrôle apparaît lorsque le script est activé
  controlRight    : true,  // Le panneau de contrôle est situé à droite
  controlBottom   : false, // Le panneau de contrôle est situé en bas de la page
  controlAlwaysOn : true,  // Le panneau de contrôle est toujours affichés
  favicon         : true,  // L'icône de la page change lors de l'activation du script
  unreadIndicator : true,  // Indiquer les messages non-lus dans le titre
  quotedIndicator : true,  // Indiquer si on a été cité dans le titre
  pmIndicator     : true,  // Indiquer la présence d'un MP
  unreadIcon      : "🔔",  // Icône d'indication de messages non lus , variantes possibles : 👋🗣️💡⚡🔴🚩
  quotedIcon      : "💬",  // Icône d'indication de citation/réponse , variantes possibles : 🗨️📑📃📜📄
  pmIcon          : "✉️",  // Icône d'indication de MP, variantes possibles : 📧📩📨📥📫
  unreadHighlight : true,  // Mettre en valeur les messages non lus lors du chargement de la page
  // Paramètres de défilement
  scroll          : {
    duration      : 2000,  // Durée de base de l'animation de défilement
    onBlur        : true,  // La page défile aussi quand l'utilisateur n'est pas sur la page
    autoResume    : true,  // Reprise du défilement automatique lors d'un noveau message si on se situe en bas de page
    resumeToLast  : false, // La page défile automatiquement jusqu'au dernier message à la reprise manuelle du défilement automatique
    mode          : 0,     // mode de défilement. 0: haut du message en haut de la fenêtre, 1: bas du message en bas de la fenêtre, 2: bouton de validation en bas de la fenêtre
  },
  // Paramètres de notification
  notification    : {
    enabled   : true,   // Les notifications sont affichées
    duration  : 10000,  // Durée d'affichage d'une notification
    onfocus   : false,  // Les notifications sont aussi affichées quand l'utilisateur est sur la page
    merge     : true,   // Les notifications peuvent être combinées
    interval  : 5000,   // Intervalle minimum entre deux notifications combinées
    avatar    : true,   // Les avatars sont utilisés pour les notifications
    topic     : true,   // Le nom du topic apparaît dans le titre de la notification
    separator : "dans", // Séparateur entre le pseudo du partitipant et le titre du page
    image     : "🖼️", // Substitut d'une image dans le texte d'une notification
    link      : "🔗",  // Substitut d'un lien dans le texte d'une notification
    quote     : "📰"  // Substitut d'une citation dans le texte d'une notification
  },
  open() {},
  hide() {},
}
/*** Fin des paramètres ***/

this.$ = this.jQuery = jQuery.noConflict(true);

const VERSION = GM.info.script.version;

const FAVICON      = "https://forum.hardware.fr/favicon.ico";
const FAVICON_LIVE = "data:image/x-icon;base64,AAABAAEAEBAAAAEACAAAAgAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAAQAAAAEAgGAAAAH/P/YQAAAcdJREFUOI11kk1rE1EUhp+bzNTESCNqxU3xg260YCtpu5Cu3KgLKQVRQaJFFIuNcV0itIh2VywqIvh74kIFaZIigtViiC3MpJghyWQySa6LMmnn692d95znnHvvuWJu/YZs2DWsTouebLOc+sBFZYKDsoRB7nuW7eYfl59Qkyh6s9w3FkZf+OCW+MfTQppqcxuvTNtAcYLFsTUmY9OeySaZQprdABggrg4ScSZ74S1+8Hh9NhQGkLKL8jL1kQvKJV+yalUxTD0UBmh1Goh2ryPDCr62P7Py7Ulog9lzD/eu4KgudukJsx9PDEyxOLYWCM+cfUB6aH6/gSUMHn2ZIVuacxVOxqbJjb/xwfdP7p0s4sCZwl2srsnf+ia5zYwLSB26zPPxdwBcPX2nDwOImtRktnDPt+fzx6d4NfLe5e2ILU7JMy4vqt/8uaw1ynilmxVKVokrx673vSMc9dVFduq/faajDf0TmY3bSNENzL+trKDE1UFM2whtMpIcZYAeNlGXv/TrGUUtv/+Vg+S8tu35KavlJYpanlg0jhI2/eCqgiYDtLomyonDwzTsmqvo2vAt0kPzLk8VNq8rqxS1PHElASJKQk3yHwkYsIF88Iw+AAAAAElFTkSuQmCC";
const USER_ACTION  = "scroll DOMMouseScroll mousewheel keyup";

const COG_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAABkklEQVQoz1VRTUsCYRBe/AHe/Qn+j710EbKLVJcyiAqLLkWJkdkSUdChOpQRRWVRG6RQUqirtq7pupZRUvRxyOIlIU9ed5+mbSFjDjPvzDPPM+8MB+7PVG9ekiXJ25qzXMVZtqu2fP0D7xDrZ7aY/djZAqiEy3qRKY4se8ULYizqENm+vhO2ADf+Z3zhCdlmyqjiDieG2FTBEMeC3wQUA7LxTIVHAlVNfwsVV5gwRgOWRE64QwkFXGAD28hCQYb65wVT4kqTa+nGAzQkMKOM81P8knJJIA2LjblaSONk/ZOICyhjD7P8T886L0ImNoUGHtI5SX8jTYU6olg2Aav8ATHEkaZ8j87taEu1rcY1QUrYVNb4FZLIkNw5+hqeWodmDikKORorhzwOsU9RCqcUDQjWHo4CEeOeyioqNEuemHJI0mvY6P/95q4/gVdEEGoKhkzqPmO4GSH9abj91h6C4RG9j405Qkwlhl7W6fAwl94WbjnWiHPQPmkL1pOIoaveaeu2u5z/rvlrPq9Hapfc/879DQmIXQjyme6GAAAAAElFTkSuQmCC";
const UNLOCKED_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJpSURBVDjLdZLLaxNRFIe/O2kTqxmNxAopUjXWB7pwrUIXggs3oispCoqCFWG0G6H9D6Su3IjrQEAExYULF+LKlagUNL5qs4i0jRhokj6mM/dxXIyPIdgDh3s43Pvx+517lIiQjmq1etJaeyuKomPAFmPMC2PMvSAIXvKfUGlApVK57vv+/aGhIeV5HgArKyvMzc1Jq9W6MTk5+aAX0Jd6fCifz0+XSiXVaDRoNpsA+L5PqVRSYRhOl8vln/V6/XEa4P0put3uq2Kx6M/Pz9NsNi8GQaCCIFCLi4uXZmdnKRQK+bGxsTu9CrxUnTPGsLCwsBQEQfVPc2pqqgK0Op2OGhwczG9oAchYaxER23tpYmJikA1CiQiNV1fk2cxRjFNYazlz5A0Z0Yg1iElSa/vUddtPgfMKOe2J4eC1dypRIML45WMoPFRmAMVpcAr6NgECVvOxevEscBZg5Nwdvj28+c+CWAMIpvWIvtwOlMqD64eBAoiDtQ4jJ0aJw3mcWQPnkDhKAYwBJ2Bj2rW3eN4WCoeP8/35XcTtZHj0FO3PNeJwCX/PdkQsouM0QIMIYjWFgwfwsjtAOWxked8aYJiYwr69rK/mELMG4v4CPADRGhELVrP0YYZ27TV4BrfuiMIIJKb95RPtr43ErnOI1ikFWidUG1PYv4fM5iJ4MeUL45S1ge4Ptu0bItvtTxQ46QXE4BzOxLRrNTKbfdiUh74sOAPdNuHST/TqMv7wVgSX2E4DRCy5XVcZ2J1BZXPJF3r94CzEIX64jNUR4mwyL2NSgDii/uR2MgtjEKN/p/l7Ym2yWNYmtUsW9hfAtnFXLnJPWAAAAABJRU5ErkJggg==";
const LOCKED_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ/SURBVDjLbVJBaxNBGH2bpEkTmxi1NTRKTZtoQUHEWz0Igj2I4kG9eVNQhEBO7bEHc+yv8JAiHnr2B4gFqVrQRhObljQolBSTJqZJdnZmfbNr2rU68DEz33zfm/fejGHbNrxjaWlpRCk1J6WcYZxkgPGTsWJZ1mIul/vlrTe8AIVC4Qqbl5PJ5GQsFoPP5wP36PV6qNfr2OIg0L35+fm1fwDYPMLDj+l0OmOaJmq1Gjqdjr4dgUAAiUTCqSsWixvMXV5YWOjqvW+AxOSz8fHxjBAC5XJ5s91up7gO6tDrUqn0QwOTXYZSsoO+wGDB5EwkEkGlUgGb7mSz2apHajWfz9+sVqvFVCrl1P4PYExr5m16vYUjQ+c0O11DtmN/ebD95pG9UpnGzl7Y0Xz30ir8toAtLdiWG0JIvFi76piaGG7g9plVTD/5YLgMCPLg/g0YtMTwhznfApRBfsP6kAYJSKuN57Md5oXTsvHy7aEEfZMutHZfIRAahWGMsHAICMeZVsD+HmTrG8zudyhrH+HJLGyz7wEgRSh9k4nm+nvqPIb4xWuovV5k/2lMXJ9F8+s6ARqIpk6QsIQtTC+AcGTYpBqfvgBfcJTuKMi+xKfdMCZgIp6eRK8TYu2+w2oA4PwDm+5qVK218XmNLN7xxILqKfS7pGqTWekLmuVtV65STs8hA73RqJQQP5+CP3KKACamHj7FlGBDawfH00kEW0MuA8o9AmA6qMrSHqwTIAoM08hAkHkN0ES3UYfotBGdiNFu5cr2AmgJobOPET7nhxEMuU/o40soSjO7iHbbVNgnUen6pY0/AOCTbC7PuV44H0f8Cetg5g9zP5aU7loDcfwGcrKyzYdvwUUAAAAASUVORK5CYII=";
const BELL_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAKnSURBVDjLlZJbSNNhGMaFroKCbgqCHW37W24tT6mFRZq1sougqIzwQoKoCyMxSMWyZkV4KkemCUtJcSibkznn1A3pNGYTNY+bOptb2g42TzS1kU/fAodRZl088H3wPr/vfd/vCQIQ9D8aaaJUg3Kuz1AarPDfNzYoqe0mJRVKjNtMSm6eVRUBd3MiWvLYvg0BlhbqOTHahhXUHHn1u029H/rH7BV9ER/yHFbTugBi5I6qqUVnTxqWXFosO1sx25UOV1M8BsrDoMxl5a7W/sl81tpxAO6hfHxzqTHXfR6eNwlwKnhwNMbAoTkKtYhl+g1AjDuJ2qeMyViw1mHJ/hJzxiTMvI3HtO4g3JpIuFQCuLQn0VXM8QUAoyqKS4xTZNYVd/8d+GaN+Gq5D7deCKfuMCabYzBWuxd2GR/ORtJF6wl0PAheDgCG5Vytu+8clh0SeCcy4TWlYrH/DFyv4jFaH46hSh4+lFGwSkN+jjGlPo7GbJYtAOir4kzOW65h3iLC+xo+eutDMVgXjTEipyYaxhIOup/sgr2WA3fbMUzI4lB3kykLADqfBleMqOLgMedgoOE0VPdioRMfgbaAjY8yATytYegTs2GRMOFoSUTPMx5qrjOEvyzxdTFb3yONIF1kQ3FLAK+1EF96M6HJ56OziIGZZooAWGQfJEC32Z61vxY4tD1kmw1V4TC8uIBxXQa84yKMqC6iJGUrdHd3YEHJha3hEKQ3mIN/BPhFAtKgK96HtsJYKDJ50JcloPTSFjxK2oxuMQ0WaRSqrtIn1gX4Jc9mCeVZTOhJ4uyGU/j8TgiDZA8+qXejt0yAisv0zr8CViXNYIqk6QzoCngwV0fBXBmJpqwQlKbQRP8E8Ks6jbFJcoWeU55Kd4pTaNMlybR2cTKNtbbmB+pfvh6cSOd2AAAAAElFTkSuQmCC";
/* Icons by Mark James - http://www.famfamfam.com/lab/icons/silk/ - CC BY 2.5 - https://creativecommons.org/licenses/by/2.5/ */

const PSEUDO = $("input[name='pseudo']").attr("value");

let page = {
  title         : document.title,
  responseUrl   : String($(".message").find("a[href^='/mess']") // Modèle pour générer les réponses manquantes des messages ajoutés
                                      .attr("href")),
  topic                 : $(".fondForum2Title").find("h3").text(),           // Titre du sujet
  unread                : 0,                                                 // Nombre de messages non lus
  quoted                : false,                                             // Un message non-lu cite le pseudo
  queue                 : [],                                                // File d'attente des messages restant à ajouter à la page
  lastMessage           : $(".messagetable").last(),                         // Dernier message actuellement présent sur la page
  fetched               : $(document),                                       // Dernière version de la page
  fetchedTable          : $(".messagetable"),                                // Liste des messages de la dernière version de la page
  url                   : document.URL,                                      // URL de la page actuelle
  messageAnchor         : parseInt(document.URL.replace(/.+#t(\d+)$/,"$1")), // message pointé par l'URL
  index                 : $(".cBackHeader").find("b").last().text(),         // Numéro de la page actuelle
  storedData            : {},                                                // Données relatives au topic utilisées lors du chargement du script
  mergeCounter          : 0,                                                 // Nombre de pages ajoutés
  isLive                : false,                                             // Le script est en cours d'execution
  isFetching            : false,                                             // La page est en train d'être récupérée pour traitement
  isUpdating            : false,                                             // Des messages sont en train d'être ajoutés à la page
  isNotifying           : false,                                             // Une notification a été envoyé il y a peu de temps
  isScrolling           : false,                                             // Un ordre de défilement a déjà été envoyé à la page
  isMerging             : false,                                             // La page suivante est en train d'être intégrée
  isLocked              : !document.hop,                                     // Le sujet est verrouillé
  isFull                : false,
  autoScroll            : true,                                              // La page défile automatiquement
  resumeScrollRequested : false,                                             // Le défilement automatique rependra au prochain message
  notifications         : [],                                                // File d'attente des notifications
  get next() { // Page suivante
    return $(page.fetched).find(".pagepresuiv:first a");
  },
  get isLast() { // La page actuelle est la dernière du topic
    return page.next.length == 0;
  },

  /* Passer à la page suivante */
  goNext() {
    //console.log("page change...");
    setTimeout(() => window.location.href = $(page.fetched).find(".pagepresuiv:first a").attr("href"), config.changePageDelay);
  },

  /* Demander la dernière version de la page et rajouter les nouveaux messages dans la pile */
  fetch() {
    if (!page.isFetching) {
      page.isFetching = true;
      $.get(page.url, {complete: page.endFetch}, page.succeedFetch);
    }
  },

  endFetch() {page.isFetching = false},

  succeedFetch(data) {
    if (page.isMerging) {
      page.addNextPage(data);
    } else {
      page.addFetchedPage(data);
    }
  },

  /* Ajouter les nouveaux messages à la page en cours */
  addFetchedPage(data) {
    page.fetched = $.parseHTML(data);
    page.checkLock(false);
    let newFetchedTable = $(page.fetched).find(".messagetable");
    let messageIndex = page.fetchedTable.length;
    //console.log("old: " + page.fetchedTable.length + " " + getID(page.fetchedTable.get(messageIndex-1))
    //           +" new: " + newFetchedTable.length + " " + getID(newFetchedTable.get(messageIndex-1))
    //           );
    if (getID(page.fetchedTable.get(messageIndex-1)) != getID(newFetchedTable.get(messageIndex-1))) {
      //console.log("Deletion detected !");
    }
    for (; messageIndex < newFetchedTable.length; ++messageIndex) {
      page.queue.push(newFetchedTable.get(messageIndex));
      //console.log("+ " + debug(newFetchedTable.get(messageIndex)));
    }
    page.fetchedTable = newFetchedTable;
    page.checkLock(true);
    page.update();
  },

  /* Intégrer la page suivante à la page en cours */
  addNextPage(data) {
    ++page.mergeCounter;
    page.storedData.pageIndex = parseInt(page.index) + page.mergeCounter;
    page.saveData();
    
    // mise à jour du numéro de page dans les url de réponse et dans l'historique
    $(document.hop).find("input[name='page']").attr("value", page.storedData.pageIndex + "");
    $("#repondre_form").parent().html($("#repondre_form").parent().html().replace(/(&amp;page=)\d+/g,"$1" + page.storedData.pageIndex));
    history.pushState(null, null, page.url);
    
    let messageIndex = 1;
    page.fetched = $.parseHTML(data);
    page.checkLock(false);
    page.fetchedTable = $(page.fetched).find(".messagetable");
    page.addAlert(`Page ${$(page.fetched).find(".cBackHeader b").last().text()}`);
    //console.log("new: " + page.fetchedTable.length);
    for (; messageIndex < page.fetchedTable.length; ++messageIndex) {
      page.queue.push(page.fetchedTable.get(messageIndex));
      //console.log("+ " + debug(page.fetchedTable.get(messageIndex)));
    }
    // Mise à jour des bandeaux de navigations :
    let newTopRow = $(page.fetched).find(".fondForum2PagesHaut");
    let oldTopRow = $(".fondForum2PagesHaut");
    oldTopRow.after(newTopRow);
    oldTopRow.get(0).remove();
    let newBottomRow = $(page.fetched).find(".fondForum2PagesBas");
    let oldBottomRow = $(".fondForum2PagesBas").last();
    oldBottomRow.after(newBottomRow);
    oldBottomRow.get(0).remove();
    $(".fondForum2PagesBas .pagepresuiv").last().after(newButton());

    page.isMerging = false;
    page.checkLock(true);
    page.update();
  },

  /* Ajouter un message d'information en provenance du script */
  addAlert(content) {
    let alert = $(".fondForum2PagesBas").parent().parent().get(0).cloneNode(true);
    alert.className = "hfr-live-alert messagetable";
    alert.style.lineHeight = 2;
    $(alert).find("tr").get(0).innerHTML = content;
    page.queue.push(alert);
  },
  
  /* Vérifier si la page récupérée a été verrouillée (true) ou dévérouillée (false) */ 
  checkLock(lockStatus) {
    let isLocked = !$(page.fetched).find("form[name='hop']").get(0);
    if (isLocked == lockStatus && isLocked != page.isLocked) {
      page.isLocked = isLocked;
      page.addAlert(`Le sujet a été ${isLocked?"":"dé"}vérouillé`);
    } 
  },
  
  /* Demander le traitement de la file d'attente */
  update() {
     if (!page.isUpdating) {
      page.isUpdating = true;
      page.processQueue();
     }
  },

  /* Vider la file d'attente avec un temps mort entre chaque message */
  processQueue() {
    let message = page.queue.shift();
    if (message) {
      //un message est présent dans la file d'attente
      page.lastMessage.after(message);
      //console.log("- " + debug(message));
      if (!message.classList.contains("hfr-live-alert")) {
        // Le message n'est pas une alerte venant du script
        let messageID = getID(message);
        repairLink(message);
        $(message).hide().fadeIn(config.fadeInTime);
        if (page.autoScroll && document.hasFocus()) clearHighlight();
        if (page.storedData.messageIndex < messageID) {
          setNew(message);
          page.storedData.messageIndex = messageID;
          page.saveData();
        }
        if (config.quotedIndicator) page.quoted = page.quoted || hasPseudo(message);
        if (config.unreadIndicator || config.quotedIndicator) page.updateTitle();
        if(page.storedData.notifications
           && ("Notification" in window)
           && (!document.hasFocus() || config.notification.onfocus)) {
          page.notifications.push(message);
          page.notify();
        }
      }
      page.lastMessage = $(".messagetable").last();      
      page.requestScroll();
      if (document.hasFocus() && page.isLast) {
        setTimeout(page.processQueue, config.messageInterval);
      } else {
      //Pas de temporisation hors focus car les navigateurs fixent le minimum à 1 s dans ce cas de figure
        page.processQueue();
      }
    } else {
      // pas de message dans la file d'attente
      page.isUpdating = false;
      if (!page.isLast) {
        if (page.mergeCounter + 1 < config.pageAmount) {
          // La page suivante va être intégrée à la page actuelle
          page.isFull = false;
          page.url = page.next.attr("href");
          page.isMerging = true;
          //console.log("page merge...");
          page.requestScroll();
        } else {
          // plus de place sur la page actuelle, passage à la page suivante
          if (page.autoScroll) {
            if (config.changePage) page.goNext();
          } else {
            if (!page.isFull) page.addAlert(`<a href="${$(page.fetched).find(".pagepresuiv:first a").attr("href")}">Passer à la page suivante pour voir les nouveaux messages.</a>`);
          }
          page.isFull = true;
        }
      }
    }
  },

  /* Demander de faire défiler la page */
  requestScroll() {
    page.isScrolling = true;
    if (page.resumeScrollRequested) page.resumeAutoScroll();
    if (page.autoScroll) page.scroll();
  },

  /* Faire défiler la page jusqu'au dernier message */
  scroll(...message) {
    $("html, body").stop(); // Arrêt du défilement en cours
    let target   = page.lastMessage;
    let duration = config.scroll.duration;
    
    if (message.length && message[0]) {
      target   = message[0];
      duration = 500;
    };

    let ease = (page.queue) ? "linear" : "swing"; // Utiliser une vitesse de défilement constante en cas de messages multiples
    $("html, body").on(USER_ACTION, page.stopAutoScroll); // Arrêt du défilement si action de l'utilisateur
    if (document.hasFocus() || config.scroll.onBlur) {
      if (message.length && message[0]) {
        $("html, body").animate({scrollTop: target.offset().top}, duration, ease, page.endScroll); //haut message -> haut fenêtre
      } else {
        switch (config.scroll.mode) {
          case 0 : $("html, body").animate({scrollTop: target.offset().top}, duration, ease, page.endScroll); break; //haut message -> haut fenêtre
          case 1 : $("html, body").animate({scrollTop: target.offset().top + target.get(0).offsetHeight -$(window).height()}, duration, ease, page.endScroll); break; //bas message -> bas fenêtre
          case 2 : window.scrollTo(0,$("#md_fast_search").offset().top+$("#md_fast_search").get(0).offsetHeight-$(window).height()); break; // bas bouton validation -> bas fenêtre
          default: $("html, body").animate({scrollTop: target.offset().top}, duration, ease, page.endScroll); //haut message -> haut fenêtre
        } 
      }
    } else {
      page.endScroll();
    }
  },

  endScroll() {
    $("html, body").off(USER_ACTION);
    page.isScrolling = false;
  },

  /* Arrêt définitif du défilement automatique */
  stopAutoScroll() {
    page.autoScroll = false;
    page.storedData.autoScroll = false;
    page.saveData();
    $("html, body").stop();
    $("html, body").off(USER_ACTION);
    if (page.isLive && config.scroll.autoResume) page.startBottomObserver();
    lock.unlock();
  },

  /* Reprise du défilement automatique */
  resumeAutoScroll() {
    page.autoScroll = true;
    page.storedData.autoScroll = true;
    page.saveData();
    page.resumeScrollRequested = false;
    if (config.scroll.autoResume) page.endBottomObserver();
    lock.lock();
    if (config.scroll.resumeToLast) page.requestScroll();
  },
  
  /*  */
  startBottomObserver() {
    $(window).scroll(resumeScrollObserver);
  },
  
  /*  */
  endBottomObserver() {
    $(window).off("scroll",resumeScrollObserver);
  },
  
  /* Mettre à jour le titre de la page */
  updateTitle() {
    if (document.hasFocus()) {
      page.unread = 0;
      page.quoted = false;
      document.title = page.title;
    } else {
      page.unread++;
      document.title = `${(config.unreadIndicator) ? page.unread + " " + config.unreadIcon : ""}${(page.quoted) ? config.quotedIcon : ""} ${page.title}`;
    }
  },

  /* Changer l'icône de la page */
  changeFavicon(icon) {
    let link = $("link[rel*='icon']").get(0) || document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = icon;
    document.head.appendChild(link);
  },

  /* Demander le traitement des notifications */
  notify() {
    if (!page.isNotifying) {
      page.isNotifying = true;
      page.processNotificationQueue();
    }
  },

  /* Traiter la file d'attente des notifications */
  processNotificationQueue() {
    if (config.notification.merge && page.queue.length) {
    //On attend que la file d'attente des messages soit vide pour traiter les notifications combinées
      page.isNotifying = false;
      return;
    }

    let message = page.notifications.shift();
    if (message) {
      let firstMessage = message;
      let title = 0;
      let option = {body:""};
      if (page.notifications.length) {
      //Plusieurs notifications présentes, les participants sont affichés
        let names = new Set();
        while (message) {
          ++title;
          names.add($(message).find("b.s2").text());
          message = page.notifications.shift();
        }
        title += " messages";
        names.forEach(name => option.body += `${name}, `);
        option.body = `De ${names.size} participants : ${option.body.slice(0,-2)}.`;
      } else {
      // Une seule notification, le message est affiché
        title = $(message).find("b.s2").text();
        option.body = formatBody(message);
        const icon = $(message).find(".avatar_center>img").attr("src");
        if (icon && config.notification.avatar) option.icon = icon;
      }
      if (config.notification.topic) title += ` ${config.notification.separator} ${page.topic}`;
      displayNotification(title, option, firstMessage);

      if (config.notification.merge) {
        setTimeout(page.processNotificationQueue, config.notification.interval);
      } else {
        page.processNotificationQueue();
      }
    } else {
      page.isNotifying = false;
    }
  },
  
  /* Sauvegarder les informations de la page utiles lors du lancement du script*/
  saveData() {
    GM.setValue(page.topicIndex, JSON.stringify(page.storedData));
  },
  
  /* Marquer les messages nons lus lors du premier chargement de la page */
  highlightUnreadMessage() {
    let lastID  = parseInt(listenumreponse[listenumreponse.length - 1]);
    if (page.storedData.messageIndex < lastID) {
      // des messages non-lus sont présents sur la page
      let firstID = parseInt(listenumreponse[0]);
      
      if (config.unreadHighlight) {
        if (page.storedData.messageIndex < firstID ) {
          // tous les messages sont nouveaux
          $(".messagetable").addClass("hfr-live-highlight");
        } else {
          // le dernier message lu est (ou était) dans la page (sauf en dernière position)
          $(`a[name="t${page.storedData.messageIndex}"]`).closest(".messagetable").nextAll(".messagetable").addClass("hfr-live-highlight");
        }
      }

      page.storedData.messageIndex = lastID;
      page.saveData();
    };
  }
}

page.post       = page.responseUrl.replace(/.*&post=(\d+).*/g, "$1");
page.cat        = page.responseUrl.replace(/.*&cat=(\d+).*/g,  "$1");
page.topicIndex = `${page.cat}&${page.post}`;

/* Réparer le lien de citation d'un message ajouté */
function repairLink(message) {
  let quoteButton = $(message).find("img[alt='answer']").get(0);
  $(quoteButton).wrap(`<a href ="${getURL(message)}"></a>`);
}

/* Renvoyer le lien pour citer un message */
function getURL(message) {
  return page.responseUrl.replace(/&numrep=\d+&/g,`&numrep=${getID(message)}&`);
}

/* Renvoyer l'ID d'un message */
function getID(message) {
  return parseInt($(message).find("a[name^='t']").attr("name").substring(1));
}

/* Vérifie si un message contient une citation du pseudo */
function hasPseudo(message) {
  return $(message).find(".citation b.s1>a").text().replace(" a écrit :","").includes(PSEUDO);
}

/* Formatter le texte pour la notification */
function formatBody(message) {
  //Suppressions des élements autres que le texte du message :
  let content = $(message).find("div[id^='para']").get(0).cloneNode(true);
  //formatage des citations :
  $(content).find(".citation p, .citation ul, .citation .container, .oldcitation p, .oldcitation ul, .oldcitation .container, .quote p, .quote ul, br, .edited, .signature").remove();
  $(content).find("b.s1").each((i,el) => {
    el.innerHTML = el.innerHTML.replace(/ a écrit :/g,"");
    el.innerHTML = `@@@HL@@@${el.innerHTML}@@@LH@@@`;
    el.innerHTML = el.innerHTML.replace(/@@@HL@@@Citation :@@@LH@@@/g, config.notification.quote + "\n");
  });
  //Remplacement des images, des liens et des smileys par un substitut ou par leur alt respectivement :
  $(content).find("a.cLink img").each((i,el) => el.parentNode.outerHTML = config.notification.image + config.notification.link + el.parentNode.hostname);
  $(content).find("img").each((i,el) => el.outerHTML = el.alt.replace(/.+\/\/.*/g, config.notification.image));
  $(content).find("a.cLink").each((i,el) => el.outerHTML = config.notification.link + el.hostname + " ");
  //Formatage des sauts de lignes :
  content.innerHTML = content.innerHTML
                        .replace(/ ([\,,\.,\n, ])/g,"$1")
                        .replace(/&nbsp;/g,"")
                        .replace(/(\n)+/g,"\n")
                        .replace(/<p>(\n)+/g,"<p>")
                        .replace(/<p><\/p>/g,"");
  let text = content.textContent;
  // regroupement des citations
  text = text.replace(/@@@LH@@@@@@HL@@@/g,", ")
             .replace(/@@@LH@@@/g," : ")
             .replace(/@@@HL@@@/g,"@");
  return text;
}

/* Afficher une notification */
function displayNotification(title, option, message) {
  if (Notification.permission == "granted") {
    let n = new Notification(title, option);
    if (message) n.onclick = () => message.scrollIntoView();
    setTimeout(n.close.bind(n), config.notification.duration);
  } else if (Notification.permission != "denied") {
    Notification.requestPermission().then( (result) => {
      if (result == "granted") {
        let n = new Notification(title, option);
        if (message) n.onclick = () => message.scrollIntoView();
        setTimeout(n.close.bind(n), config.notification.duration);
      }
    });
  }
}

/* Fonction de débogage */
function debug(message) {
  return $(message).find("a").attr("name") + " " + $(message).find("b.s2").text();
}

/* Lancer/Arrêter le script */
function toggleScript() {
  page.isLive = !page.isLive;
  if (page.isLive) {
    // lancer le script
    page.fetch();
    page.fetchTimer = setInterval(page.fetch, config.fetchInterval);
    page.storedData.scriptOn  = true;
    page.storedData.pageIndex = parseInt(page.index) + page.mergeCounter;
    page.saveData();
    $(".hfr-live-button").each((i,el) => {
      el.setAttribute("on",true);
      el.title = "Désactiver [HFR] Live";
    });
    if (config.control) control.show();
    if (config.favicon) page.changeFavicon(FAVICON_LIVE);
    if (!page.autoScroll && config.scroll.autoResume) {
      page.startBottomObserver();
      resumeScrollObserver();
    }
  } else {
    // arrêter le script
    clearInterval(page.fetchTimer);
    page.storedData.scriptOn  = false;
    page.storedData.pageIndex = -1;
    page.saveData();
    $(".hfr-live-button").each((i,el) => {
      el.setAttribute("on",false);
      el.title = "Activer [HFR] Live";
    });
    control.hide();
    if (!page.autoScroll) {
      page.endBottomObserver();
      lock.unfade();
    }
    if (config.favicon) page.changeFavicon(FAVICON);
  }
}

/* Création des boutons */
GM.addStyle(`
  .hfr-live-legacy, .hfr-live-led {
    float       : right;
    font-weight : bold;
    cursor      : pointer;
  }
  .hfr-live-legacy[on="true"][colorblind="false"] {
    background-color : #4bc730;
  }
  .hfr-live-legacy[on="true"][colorblind="true"] {
    background-color : #32b1ff;
  }
  .hfr-live-legacy[on="false"] {
    background-color : #f39c12;
  }
 .hfr-live-led[on="true"][colorblind="false"] {
    background-image : -webkit-linear-gradient(top, #13fB04 0%, #58e343 50%, #ADED99 100%);
    box-shadow       : 0px 0px 2px #00000080, 0px 0px 3px #13fB04;
  }
  .hfr-live-led[on="false"] {
    background-image : -webkit-linear-gradient(top, #f9a004 0%, #e0ac45 50%, #ead698 100%);
    box-shadow       : 0px 0px 2px #00000080;
  }
  .hfr-live-led[on="true"][colorblind="true"] {
    background-image : -webkit-linear-gradient(top, #32b1ff 0%, #1291ec 50%, #1291ff 100%);
    box-shadow       : 0px 0px 2px #00000080, 0px 0px 3px #32b1ff;
  }
  .hfr-live-led {
    border-radius : 50%;
    width         : 13px;
    height        : 13px;
    margin        : 2px;
  }
  .hfr-live-led:after {
    display          : block;
    content          : '';
    margin-left      : 1px;
    margin-right     : 1px;
    width            : 11px;
    height           : 7px;
    border-radius    : 50%;
    background-image : -webkit-linear-gradient(top, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%);
  }

  .fondForum2PagesBas .hfr-live-led {
    border-radius : 50%;
    width         : 10px;
    height        : 10px;
    margin        : 2px;
  }
  .fondForum2PagesBas .hfr-live-led:after {
    display          : block;
    content          : '';
    margin-left      : 1px;
    margin-right     : 1px;
    width            : 8px;
    height           : 5px;
    border-radius    : 50%;
    background-image : -webkit-linear-gradient(top, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%);
  }

  .fondForum2Fonctions .hfr-live-led {
    margin-top : 3px;
  }
`);

function newLedButton() {
  let led = document.createElement("div");
  led.className ="hfr-live-led hfr-live-button";
  led.setAttribute("on",page.isLive);
  led.setAttribute("colorblind",config.colorBlind);
  led.title = `${(page.isLive)?"Désactiver":"Activer"} [HFR] Live`;
  led.onclick = () => {
    if (led.getAttribute("on") == "false") clearHighlight();
    toggleScript();
  };
  return led;
}

function newLegacyButton() {
  let button = document.createElement("input");
  button.type = "submit";
  button.value = "LIVE";
  button.className ="hfr-live-legacy hfr-live-button";
  button.setAttribute("on",page.isLive);
  button.setAttribute("colorblind",config.colorBlind);
  button.title = `${(page.isLive)?"Désactiver":"Activer"} [HFR] Live`;
  button.onclick = () => {
    if (button.getAttribute("on") == "false") clearHighlight();
    toggleScript();
  };
  return button;
}

function newButton() {
  if (config.legacyButton) return newLegacyButton();
  return newLedButton();
}

$(".fondForum2Fonctions .right").first().after(newButton());
$(".fondForum2PagesBas .pagepresuiv").last().after(newButton());

/* Création du panneau de contrôle lors de l'exécution du script */
let control = document.createElement("div");
GM.addStyle(`
  #hfr-live-control {
    position         : fixed;
    height           : 19px;
    border           : 1px solid rgb(0,0,0,0.2);
    background-color : rgb(255,255,255,0.9);
  }
  #hfr-live-control[visible="true"][bottom="false"] {
    top           : -1px;
    bottom        : auto;
    padding       : 0px 3px 3px 3px;
    border-radius : 0 0 4px 4px;
    transition    : all 0.5s ease;
  }
  #hfr-live-control[visible="true"][bottom="true"] {
    top           : auto;
    bottom        : -1px;
    padding       : 2px 3px 0px 3px;
    border-radius : 4px 4px 0 0;
    transition    : all 0.5s ease;
  }
  #hfr-live-control[visible="false"][bottom="false"] {
    top        : -21px;
    bottom     : auto;
    transition : all 0.5s ease 3s;
  }
  #hfr-live-control[visible="false"][bottom="true"] {
    top        : auto;
    bottom     : -21px;
    transition : all 0.5s ease 3s;
  }
  #hfr-live-control[right="false"] {
    left  : 0;
    right : auto;
  }
  #hfr-live-control[right="true"] {
    left  : auto;
    right : 0;
  }
  #hfr-live-control>img {
    margin : 2px 1px 1px 1px;
  }
  #hfr-live-control>div {
    margin-top : 4px;
  }
`);
control.id ="hfr-live-control";
control.setAttribute("bottom",config.controlBottom);
control.setAttribute("right",config.controlRight);
control.setAttribute("visible",false || config.controlAlwaysOn);
control.show = () => control.setAttribute("visible",true);
control.hide = () => control.setAttribute("visible",false || config.controlAlwaysOn);

let lock = document.createElement("img");
GM.addStyle(`
  #hfr-live-lock {
    cursor     : pointer;
    transition : opacity 0.3s ease;
  }
  #hfr-live-lock[observer="true"] {
    opacity : 0.5;
  }
`);
lock.id = "hfr-live-lock";
lock.lock = () => {
  lock.src = LOCKED_ICON;
  lock.setAttribute("locked",true);
  lock.setAttribute("observer",false);
  lock.title = "Désactiver le défilement automatique";
}
lock.unlock = () => {
  lock.src = UNLOCKED_ICON;
  lock.setAttribute("locked",false);
  lock.title = "Activer le défilement automatique";
}
lock.fade = () => {
  lock.src = LOCKED_ICON;
  lock.setAttribute("observer",true);
}
lock.unfade = () => {
  lock.src = UNLOCKED_ICON;
  lock.setAttribute("observer",false);
}
lock.onclick = () => {
  if (lock.getAttribute("locked") == "true") {
    page.stopAutoScroll();
  } else {
    page.resumeAutoScroll();
  }
};

/* Gère la reprise du défilement automatique en fonction de la position de la page */
function resumeScrollObserver() {
   if($(window).scrollTop() + $(window).height() == $(document).height()) {
     // Si le bas de la page est atteint, demande de reprise du défilement au prochain message
     lock.fade();
     page.resumeScrollRequested = true;
   } else if (lock.getAttribute("observer") == "true") {
     // Sinon retrait de la demande
     lock.unfade();
     page.resumeScrollRequested = false;
   }
}

GM.addStyle(`
  #hfr-live-bell {
    cursor     : pointer;
    transition : opacity 0.3s ease;
  }
  #hfr-live-bell[on="false"] {
    opacity : 0.5;
  }
`);

let bell = document.createElement("img");
bell.id = "hfr-live-bell";
bell.src = BELL_ICON;
bell.onclick = toggleNotifications;
bell.turnOn  = () => {
  bell.setAttribute("on",true);
  bell.title = "Désactiver les notifications";
};
bell.turnOff = () => {
  bell.setAttribute("on",false);
  bell.title = "Activer les notifications";
};

function toggleNotifications () {
  if (bell.getAttribute("on") == "true") {
    bell.turnOff();
    page.storedData.notifications = false;
  } else {
    bell.turnOn();
    page.storedData.notifications = true;
  }
  page.saveData();
};



let configImage = document.createElement("img");
configImage.src = COG_ICON;
configImage.style.cursor = "pointer";
configImage.title = "Configurer [HFR] Live";
configImage.onclick = config.open;

control.appendChild(configImage);
control.appendChild(bell);
control.appendChild(lock);
control.appendChild(newButton());
document.body.appendChild(control);
lock.lock();


/* Création du panneau d'indication de nouveaux messages */
let newMessagePanel = document.createElement("div");
let container = document.createElement("div");
GM.addStyle(`
  #hfr-live-new-panel {
    position    : fixed;
    left        : 0;
    right       : 0;
    font-family : Verdana,Arial,Sans-serif,Helvetica;
    text-align  : center;
  }

  #hfr-live-new-panel>div {
    margin        : 0 auto;
    width         : 190px;
    padding       : 3px;
    border        : 1px solid rgb(0,0,0,0.2);
    border-radius : 4px;
    color         : #fff;
    font-weight   : bold;
    font-size     : small;
    cursor        : pointer;
  }
  #hfr-live-new-panel[visible="true"] {
    bottom : 10px;
  }
  #hfr-live-new-panel[visible="false"] {
    bottom : -50px;
  }
  #hfr-live-new-panel[colorblind="true"]>div {
    background-color : #32b1ff;
  }
  #hfr-live-new-panel[colorblind="false"]>div {
    background-color : #4bc730;
  }
  .hfr-live-highlight {
    box-shadow : -3px 0px 1px -1px #4bc730;
  }
`);
newMessagePanel.id ="hfr-live-new-panel";
newMessagePanel.setAttribute("colorblind",config.colorBlind);
newMessagePanel.newAmount = 0;
container.innerHTML = "Nouveaux messages";
newMessagePanel.show = () => newMessagePanel.setAttribute("visible",true);
newMessagePanel.hide = () => newMessagePanel.setAttribute("visible",false);
newMessagePanel.update = () => {
  if (newMessagePanel.newAmount == 0) {
    newMessagePanel.hide();
  } else {
    newMessagePanel.show();
    if (newMessagePanel.newAmount == 1) {
    container.innerHTML = "Nouveau message";
    } else {
      container.innerHTML = newMessagePanel.newAmount + " Nouveaux messages";
    }  
  }
}

newMessagePanel.increase = () =>  {
  ++newMessagePanel.newAmount;
  if (newMessagePanel.newAmount == 1) $(window).scroll(newMessageObserver);
  newMessagePanel.update();
}
newMessagePanel.decrease = () =>  {
  --newMessagePanel.newAmount;
  if (newMessagePanel.newAmount == 0) $(window).off("scroll",newMessageObserver);
  newMessagePanel.update();
}

newMessagePanel.onclick = () =>  {
  page.scroll($(".hfr-live-new"));
}
newMessagePanel.update();

newMessagePanel.appendChild(container);
document.body.appendChild(newMessagePanel);

/* Marque un message comme nouveau et colorie sa bordure */
function setNew(message) {
  if ($(message).offset().top + $(message).get(0).offsetHeight > document.documentElement.scrollTop + $(window).height()) {
    //Si le bas du message est situé plus bas que le bas de l'écran, le message est nouveau
    $(message).addClass("hfr-live-new");
    newMessagePanel.increase();
  }
  $(message).addClass("hfr-live-highlight");
}

/* Retire l'attribut nouveau des messages déjà visionnés */
function newMessageObserver() {
  $(".hfr-live-new").each((i,el) => {
    if ($(el).offset().top + $(el).get(0).offsetHeight <= document.documentElement.scrollTop + $(window).height() ||
       $(el).offset().top <= document.documentElement.scrollTop) {
      // si le bas d'un nouveau message est situé plus haut que le bas de l'écran,
      // ou que le haut du message est hors de l'écran, le message n'est plus nouveau
      $(el).removeClass("hfr-live-new");
      newMessagePanel.decrease();
    }
  });
}

/* Retire l'attribut marqué (bordure colorée) aux messages déjà visionnés */
function clearHighlight() {
  $(".hfr-live-highlight").removeClass("hfr-live-highlight");
}

/* Vérification de l'état du script au chargement de la page */
(async () => {
  const DEFAULT_PAGE_DATA = {
    version       : VERSION,
    scriptOn      : false,
    autoScroll    : false,
    notifications : config.notification.enabled,
    pageIndex     : -1,
    messageIndex  : 0,
  };
  const DEFAULT_PAGE_DATA_STRING = JSON.stringify(DEFAULT_PAGE_DATA);
  const PAGE_DATA = await GM.getValue(page.topicIndex, DEFAULT_PAGE_DATA_STRING);
  page.storedData = JSON.parse(PAGE_DATA);
  if (!page.storedData.version) page.storedData = JSON.parse(DEFAULT_PAGE_DATA_STRING);
  if (page.storedData.autoScroll) {
    page.resumeAutoScroll();
  } else {
    page.stopAutoScroll();
  }

  if (page.storedData.notifications) {
    bell.turnOn();
  } else {
    bell.turnOff();
  }
  
  if (page.messageAnchor && page.messageAnchor > page.storedData.messageIndex) {
    // Si l'url pointe vers un message qui est postérieur au dernier message lu
    page.storedData.messageIndex = page.messageAnchor;
    page.saveData();
  }
  page.highlightUnreadMessage();
  
  if (page.storedData.scriptOn && page.storedData.pageIndex == parseInt(page.index)-1) {
    // Si le script était actif dans la page précédente, l'activer pour cette page
    ++page.storedData.pageIndex;
    page.saveData();

    if (page.isLast) {
      while ($(".messagetable").get(1)) {
        // Supprimer les messages de la page (pour les laisser ensuite apparaître via le script)
        $(".messagetable").get(1).remove();
      }
      page.lastMessage = $(".messagetable").last();
      page.fetchedTable = $(".messagetable");
    } else {
      // Si la page déjà pleine, ajouter tous les messages aux notifications
        if(page.storedData.notifications && ("Notification" in window) && (!document.hasFocus() || config.notification.onfocus)) {
          $(".messagetable").each((i,el) => {page.notifications.push(el)});
          page.notifications.shift(); //Le premier message qui appartient à la page précédente est retiré
          page.notify();
        }
    }
  }

  if (page.storedData.scriptOn && page.storedData.pageIndex == parseInt(page.index)) {
    // Si le script a déja été activé pour cette page, lancer le script en activant le bouton
    page.storedData.messageIndex = parseInt(listenumreponse[listenumreponse.length - 1]);
    // S'il y a eu des nouveaux messages depuis la dernière visite
    if (!(page.messageAnchor && (!page.isLast || $(`a[name="t${page.messageAnchor}"]`).closest(".messagetable").next(".messagetable").get(0)))) page.stopAutoScroll();
    toggleScript();
  } else {  
    page.storedData.pageIndex = -1;
  }
  page.saveData();

})();

if (config.unreadIndicator || config.quotedIndicator) window.addEventListener("focus", page.updateTitle);