// ==UserScript==
// @name           [HFR] Live mod DdsT
// @namespace      ddst.github.io
// @version        0.1.3
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
Copyright (C) 2018 DdsT

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
 * Rendre le défilement plus intuitif
 * Indicateur de nouveau message en bas de la page
 * Résoudre le problème d'affichage multiple
 * Gérer les cas de suppression de message
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
  controlAlwaysOn : false, // Le panneau de contrôle est toujours affichés
  favicon         : true,  // L'icône de la page change lors de l'activation du script
  unreadIndicator : true,  // Indiquer les messages non-lus dans le titre
  unreadIcon      : "🔔",  // Icône d'indication de messages non lus
  // Paramètres de défilement
  scroll          : {
    duration      : 2000,  // Durée de base de l'animation de défilement
    onBlur        : true,  // La page défile aussi quand l'utilisateur n'est pas sur la page
    autoResume    : true,  // Le défilement reprend automatiquement après avoir été interrompu par l'utilisateur
    pauseDuration : 2000,  // Délai de reprise du défilement automatique après une action de l'utilisateur
    resumeToLast  : false, // La page défile automatiquement jusqu'au dernier message à la reprise du défilement automatique
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

const FAVICON      = "https://forum.hardware.fr/favicon.ico";
const FAVICON_LIVE = "data:image/x-icon;base64,AAABAAEAEBAAAAEACAAAAgAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAAQAAAAEAgGAAAAH/P/YQAAAcdJREFUOI11kk1rE1EUhp+bzNTESCNqxU3xg260YCtpu5Cu3KgLKQVRQaJFFIuNcV0itIh2VywqIvh74kIFaZIigtViiC3MpJghyWQySa6LMmnn692d95znnHvvuWJu/YZs2DWsTouebLOc+sBFZYKDsoRB7nuW7eYfl59Qkyh6s9w3FkZf+OCW+MfTQppqcxuvTNtAcYLFsTUmY9OeySaZQprdABggrg4ScSZ74S1+8Hh9NhQGkLKL8jL1kQvKJV+yalUxTD0UBmh1Goh2ryPDCr62P7Py7Ulog9lzD/eu4KgudukJsx9PDEyxOLYWCM+cfUB6aH6/gSUMHn2ZIVuacxVOxqbJjb/xwfdP7p0s4sCZwl2srsnf+ia5zYwLSB26zPPxdwBcPX2nDwOImtRktnDPt+fzx6d4NfLe5e2ILU7JMy4vqt/8uaw1ynilmxVKVokrx673vSMc9dVFduq/faajDf0TmY3bSNENzL+trKDE1UFM2whtMpIcZYAeNlGXv/TrGUUtv/+Vg+S8tu35KavlJYpanlg0jhI2/eCqgiYDtLomyonDwzTsmqvo2vAt0kPzLk8VNq8rqxS1PHElASJKQk3yHwkYsIF88Iw+AAAAAElFTkSuQmCC";
const USER_ACTION  = "scroll mousedown DOMMouseScroll mousewheel keyup";

const COG_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAABkklEQVQoz1VRTUsCYRBe/AHe/Qn+j710EbKLVJcyiAqLLkWJkdkSUdChOpQRRWVRG6RQUqirtq7pupZRUvRxyOIlIU9ed5+mbSFjDjPvzDPPM+8MB+7PVG9ekiXJ25qzXMVZtqu2fP0D7xDrZ7aY/djZAqiEy3qRKY4se8ULYizqENm+vhO2ADf+Z3zhCdlmyqjiDieG2FTBEMeC3wQUA7LxTIVHAlVNfwsVV5gwRgOWRE64QwkFXGAD28hCQYb65wVT4kqTa+nGAzQkMKOM81P8knJJIA2LjblaSONk/ZOICyhjD7P8T886L0ImNoUGHtI5SX8jTYU6olg2Aav8ATHEkaZ8j87taEu1rcY1QUrYVNb4FZLIkNw5+hqeWodmDikKORorhzwOsU9RCqcUDQjWHo4CEeOeyioqNEuemHJI0mvY6P/95q4/gVdEEGoKhkzqPmO4GSH9abj91h6C4RG9j405Qkwlhl7W6fAwl94WbjnWiHPQPmkL1pOIoaveaeu2u5z/rvlrPq9Hapfc/879DQmIXQjyme6GAAAAAElFTkSuQmCC";
const UNLOCKED_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJpSURBVDjLdZLLaxNRFIe/O2kTqxmNxAopUjXWB7pwrUIXggs3oispCoqCFWG0G6H9D6Su3IjrQEAExYULF+LKlagUNL5qs4i0jRhokj6mM/dxXIyPIdgDh3s43Pvx+517lIiQjmq1etJaeyuKomPAFmPMC2PMvSAIXvKfUGlApVK57vv+/aGhIeV5HgArKyvMzc1Jq9W6MTk5+aAX0Jd6fCifz0+XSiXVaDRoNpsA+L5PqVRSYRhOl8vln/V6/XEa4P0put3uq2Kx6M/Pz9NsNi8GQaCCIFCLi4uXZmdnKRQK+bGxsTu9CrxUnTPGsLCwsBQEQfVPc2pqqgK0Op2OGhwczG9oAchYaxER23tpYmJikA1CiQiNV1fk2cxRjFNYazlz5A0Z0Yg1iElSa/vUddtPgfMKOe2J4eC1dypRIML45WMoPFRmAMVpcAr6NgECVvOxevEscBZg5Nwdvj28+c+CWAMIpvWIvtwOlMqD64eBAoiDtQ4jJ0aJw3mcWQPnkDhKAYwBJ2Bj2rW3eN4WCoeP8/35XcTtZHj0FO3PNeJwCX/PdkQsouM0QIMIYjWFgwfwsjtAOWxked8aYJiYwr69rK/mELMG4v4CPADRGhELVrP0YYZ27TV4BrfuiMIIJKb95RPtr43ErnOI1ikFWidUG1PYv4fM5iJ4MeUL45S1ge4Ptu0bItvtTxQ46QXE4BzOxLRrNTKbfdiUh74sOAPdNuHST/TqMv7wVgSX2E4DRCy5XVcZ2J1BZXPJF3r94CzEIX64jNUR4mwyL2NSgDii/uR2MgtjEKN/p/l7Ym2yWNYmtUsW9hfAtnFXLnJPWAAAAABJRU5ErkJggg==";
const LOCKED_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJ/SURBVDjLbVJBaxNBGH2bpEkTmxi1NTRKTZtoQUHEWz0Igj2I4kG9eVNQhEBO7bEHc+yv8JAiHnr2B4gFqVrQRhObljQolBSTJqZJdnZmfbNr2rU68DEz33zfm/fejGHbNrxjaWlpRCk1J6WcYZxkgPGTsWJZ1mIul/vlrTe8AIVC4Qqbl5PJ5GQsFoPP5wP36PV6qNfr2OIg0L35+fm1fwDYPMLDj+l0OmOaJmq1Gjqdjr4dgUAAiUTCqSsWixvMXV5YWOjqvW+AxOSz8fHxjBAC5XJ5s91up7gO6tDrUqn0QwOTXYZSsoO+wGDB5EwkEkGlUgGb7mSz2apHajWfz9+sVqvFVCrl1P4PYExr5m16vYUjQ+c0O11DtmN/ebD95pG9UpnGzl7Y0Xz30ir8toAtLdiWG0JIvFi76piaGG7g9plVTD/5YLgMCPLg/g0YtMTwhznfApRBfsP6kAYJSKuN57Md5oXTsvHy7aEEfZMutHZfIRAahWGMsHAICMeZVsD+HmTrG8zudyhrH+HJLGyz7wEgRSh9k4nm+nvqPIb4xWuovV5k/2lMXJ9F8+s6ARqIpk6QsIQtTC+AcGTYpBqfvgBfcJTuKMi+xKfdMCZgIp6eRK8TYu2+w2oA4PwDm+5qVK218XmNLN7xxILqKfS7pGqTWekLmuVtV65STs8hA73RqJQQP5+CP3KKACamHj7FlGBDawfH00kEW0MuA8o9AmA6qMrSHqwTIAoM08hAkHkN0ES3UYfotBGdiNFu5cr2AmgJobOPET7nhxEMuU/o40soSjO7iHbbVNgnUen6pY0/AOCTbC7PuV44H0f8Cetg5g9zP5aU7loDcfwGcrKyzYdvwUUAAAAASUVORK5CYII=";
/* Icons by Mark James - http://www.famfamfam.com/lab/icons/silk/ - CC BY 2.5 - https://creativecommons.org/licenses/by/2.5/ */

let page = {
  title         : document.title,
  responseUrl   : String($(".message").find("a[href^='/mess']") // Modèle pour générer les réponses manquantes des messages ajoutés
                                      .attr("href")),
  topic         : $(".fondForum2Title").find("h3").text(),      // Titre du sujet
  unread        : 0,                                            // Nombre de messages non lus
  queue         : [],                                           // File d'attente des messages restant à ajouter à la page
  lastMessage   : $(".messagetable").last(),                    // Dernier message actuellement présent sur la page
  fetched       : $(document),                                  // Dernière version de la page
  fetchedTable  : $(".messagetable"),                           // Liste des messages de la dernière version de la page
  url           : document.URL,                                 // URL de la page actuelle
  index         : $(".cBackHeader").find("b").last().text(),    // Numéro de la page actuelle
  mergeCounter  : 0,                                            // Nombre de pages ajoutés
  isLive        : false,                                        // Le script est en cours d'execution
  isFetching    : false,                                        // La page est en train d'être récupérée pour traitement
  isUpdating    : false,                                        // Des messages sont en train d'être ajoutés à la page
  isNotifying   : false,                                        // Une notification a été envoyé il y a peu de temps
  isScrolling   : false,                                        // Un ordre de défilement a déjà été envoyé à la page
  isMerging     : false,                                        // La page suivante est en train d'être intégrée
  isLocked      : !document.hop,                                // Le sujet est verrouillé
  autoScroll    : true,                                         // La page défile automatiquement
  notifications : [],                                           // File d'attente des notifications
  get next() {                                                  // Page suivante
    return $(page.fetched).find(".pagepresuiv:first a");
  },
  get isLast() { // La page actuelle est la dernière du topic
    return page.next.length == 0;
  },

  /* Passer à la page suivante */
  goNext() {
    console.log("page change...");
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
    let newFetchedTable = $(page.fetched).find(".messagetable");
    let messageIndex = page.fetchedTable.length;
    console.log("old: " + page.fetchedTable.length + " " + getID(page.fetchedTable.get(messageIndex-1))
               +" new: " + newFetchedTable.length + " " + getID(newFetchedTable.get(messageIndex-1))
               );
    if (getID(page.fetchedTable.get(messageIndex-1)) != getID(newFetchedTable.get(messageIndex-1))) {
      console.log("Deletion detected !");
    }
    for (; messageIndex < newFetchedTable.length; ++messageIndex) {
      page.queue.push(newFetchedTable.get(messageIndex));
      console.log("+ " + debug(newFetchedTable.get(messageIndex)));
    }
    page.fetchedTable = newFetchedTable;
    page.checkLock();
    page.update();
  },

  /* Intégrer la page suivante à la page en cours */
  addNextPage(data) {
    ++page.mergeCounter;
    GM.setValue(`${page.cat}&${page.post}`, parseInt(page.index) + page.mergeCounter);
    history.pushState(null, null, page.url);
    let messageIndex = 1;
    page.fetched = $.parseHTML(data);
    page.fetchedTable = $(page.fetched).find(".messagetable");
    page.addAlert(`Page ${$(page.fetched).find(".cBackHeader b").last().text()}`);
    console.log("new: " + page.fetchedTable.length);
    for (; messageIndex < page.fetchedTable.length; ++messageIndex) {
      page.queue.push(page.fetchedTable.get(messageIndex));
      console.log("+ " + debug(page.fetchedTable.get(messageIndex)));
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
    page.checkLock();
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
  
  /* Vérifier si la page récupérée a été verrouillée ou dévérouillée */
  checkLock() {
    let isLocked = !$(page.fetched).find("form[name='hop']").get(0);
    if (isLocked != page.isLocked) {
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
      page.lastMessage.after(message);
      console.log("- " + debug(message));
      if (!message.classList.contains("hfr-live-alert")) {
      // Le message n'est pas un indicateur de nouvelle page
        repairLink(message);
        $(message).hide().fadeIn(config.fadeInTime);
        if (config.unreadIndicator) page.updateTitle();
        if(config.notification.enabled
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
      //Pas de temporisation hors focus car les navigateurs fixent le minimum à une seconde
        page.processQueue();
      }
    } else {
      page.isUpdating = false;
      if (!page.isLast) {
        if (page.mergeCounter + 1 < config.pageAmount) {
        // La page suivante va être intégrée à la page actuelle
          page.url = page.next.attr("href");
          page.isMerging = true;
          console.log("page merge...");
        } else {
          if (config.changePage) page.goNext();
        }
      }
    }
  },

  /* Demander de faire défiler la page */
  requestScroll() {
    page.isScrolling = true;
    if (page.autoScroll) page.scroll();
  },

  /* Faire défiler la page jusqu'au dernier message */
  scroll() {
    $("html, body").stop(); // Arrêt du défilement en cours
    let ease = (page.queue) ? "linear" : "swing"; // Utiliser une vitesse de défilement constante en cas de messages multiples
    $("html, body").on(USER_ACTION, page.pauseScroll); // Arrêt temporaire du défilement si action de l'utilisateur
    if (document.hasFocus() || config.scroll.onBlur) {
      $("html, body").animate({scrollTop: page.lastMessage.offset().top}, config.scroll.duration, ease, page.endScroll);
    } else {
      page.endScroll();
    }
  },

  endScroll() {
    $("html, body").off(USER_ACTION);
    page.isScrolling = false;
  },

  /* Arrêt temporaire du défilement automatique */
  pauseScroll() {
    if (config.scroll.autoResume) {
      page.autoScroll = false;
      $("html, body").stop();
      $("html, body").off(USER_ACTION);
      lock.pause();
      if (page.pauseTimer) clearTimeout(page.pauseTimer);
      page.pauseTimer = setTimeout(page.resumeAutoScroll, config.scroll.pauseDuration);
    } else {
      page.stopAutoScroll();
    }
  },

  /* Arrêt définitif du défilement automatique */
  stopAutoScroll() {
    page.autoScroll = false;
    $("html, body").stop();
    $("html, body").off(USER_ACTION);
    lock.unlock();
  },

  /* Reprise du défilement automatique */
  resumeAutoScroll() {
    page.autoScroll = true;
    lock.lock();
    if (config.scroll.resumeToLast && page.isScrolling) page.scroll();
  },

  /* Mettre à jour le titre de la page */
  updateTitle() {
    if (document.hasFocus()) {
      page.unread = 0;
      document.title = page.title;
    } else {
      page.unread++;
      document.title = `${page.unread} ${config.unreadIcon} ${page.title}`;
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
      displayNotification(title, option, message);

      if (config.notification.merge) {
        setTimeout(page.processNotificationQueue, config.notification.interval);
      } else {
        page.processNotificationQueue();
      }
    } else {
      page.isNotifying = false;
    }
  },
}

page.post = page.responseUrl.replace(/.*&post=(\d+).*/g, "$1");
page.cat  = page.responseUrl.replace(/.*&cat=(\d+).*/g,  "$1");

/* Réparer les liens d'un message ajouté */
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
  return $(message).find("a[name^='t']").attr("name");
}

/* Formatter le texte pour la notification */
function formatBody(message) {
  //Suppressions des élements autres que le texte du message :
  let content = $(message).find("div[id^='para']").get(0).cloneNode(true);
  //formatage des citations :
  $(content).find(".citation p, .citation br, .citation ul, .oldcitation p, .oldcitation br, .oldcitation ul, .quote p, .quote br, .quote ul, .edited, .signature").remove();
  $(content).find("b.s1").each((i,el) => {
    el.innerHTML = el.innerHTML.replace(/ a écrit :/g,"");
    el.innerHTML = `@${el.innerHTML} : `;
    el.innerHTML = el.innerHTML.replace(/@Citation : : /g, config.notification.quote + "\n");
  });
  //Remplacement des images, des liens et des smileys par un substitut ou par leur alt respectivement :
  $(content).find("a.cLink img").each((i,el) => el.parentNode.outerHTML = config.notification.image + config.notification.link + el.parentNode.hostname);
  $(content).find("img").each((i,el) => el.outerHTML = el.alt.replace(/.+\/\/.*/g, config.notification.image));
  $(content).find("a.cLink").each((i,el) => el.outerHTML = config.notification.link + el.hostname);
  //Formatage des sauts de lignes :
  content.innerHTML = content.innerHTML
                        .replace(/&nbsp;/g,"")
                        .replace(/<br>/g,"\n")
                        .replace(/(\n)+/g,"\n")
                        .replace(/<p>(\n)+/g,"<p>")
                        .replace(/<p><\/p>/g,"<p>\n</p>");
  return content.textContent;
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
    page.fetch();
    page.fetchTimer = setInterval(page.fetch, config.fetchInterval);
    GM.setValue(`${page.cat}&${page.post}`, parseInt(page.index) + page.mergeCounter);
    $(".hfr-live-button").each((i,el) => {
      el.setAttribute("on",true);
      el.title = "Désactiver [HFR] Live";
    });
    if (config.control) control.show();
    if (config.favicon) page.changeFavicon(FAVICON_LIVE);
  } else {
    clearInterval(page.fetchTimer);
    GM.deleteValue(`${page.cat}&${page.post}`);
    $(".hfr-live-button").each((i,el) => {
      el.setAttribute("on",false);
      el.title = "Activer [HFR] Live";
    });
    control.hide();
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
  led.onclick = toggleScript;
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
  button.onclick = toggleScript;
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
    display          : table-cell;
    vertical-align   : middle;
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

/* Arrêter ou Reprendre le défilement automatique */
control.toggleScroll = () => {
  if (lock.getAttribute("locked") == "true") {
    page.stopAutoScroll();
    if (page.pauseTimer) clearTimeout(page.pauseTimer);
  } else {
    page.resumeAutoScroll();
  }
}

let lock = document.createElement("img");
GM.addStyle(`
  #hfr-live-lock {
    cursor     : pointer;
    transition : opacity 0.3s ease;
  }
  #hfr-live-lock[paused="true"] {
    opacity     : 0.3;
  }
  #hfr-live-lock[paused="false"] {
    opacity     : 1;
  }
`);
lock.id = "hfr-live-lock";
lock.lock = () => {
  lock.src = LOCKED_ICON;
  lock.setAttribute("locked",true);
  lock.setAttribute("paused",false);
  lock.title = "Désactiver le défilement automatique";
}
lock.unlock = () => {
  lock.src = UNLOCKED_ICON;
  lock.setAttribute("locked",false);
  lock.setAttribute("paused",false);
  lock.title = "Activer le défilement automatique";
}
lock.pause = () => lock.setAttribute("paused",true);
lock.onclick = control.toggleScroll;

let configImage = document.createElement("img");
configImage.src = COG_ICON;
configImage.style.cursor = "pointer";
configImage.title = "Configurer [HFR] Live";
configImage.onclick = config.open;

control.appendChild(configImage);
control.appendChild(lock);
control.appendChild(newButton());
document.body.appendChild(control);
lock.lock();


/* Vérification de l'état du script au chargement de la page */
(async () => {
  let savedPage = await GM.getValue(`${page.cat}&${page.post}`);

  if (savedPage == parseInt(page.index)-1) {
    // Si le script était actif dans la page précédente, l'activer le script pour cette page
    ++savedPage;
    GM.setValue(`${page.cat}&${page.post}`, savedPage);

    if (page.isLast) {
      while ($(".messagetable").get(1)) {
        // Supprimer les messages de la page (pour les laisser ensuite apparaître via le script)
        $(".messagetable").get(1).remove();
      }
      page.lastMessage = $(".messagetable").last();
      page.fetchedTable = $(".messagetable");
    } else {
      // Si la page déjà pleine, ajouter tous les messages aux notifications
        if(config.notification.enabled && ("Notification" in window) && (!document.hasFocus() || config.notification.onfocus)) {
          $(".messagetable").each(function() {page.notifications.push(this)});
          page.notifications.shift(); //Le premier message qui appartient à la page précédente est retiré
          page.notify();
        }
    }
  }

  // Si le script a déja été activé pour cette page, lancer le script en activant le bouton
  if (savedPage == parseInt(page.index)) {
    toggleScript();
  } else {
    GM.deleteValue(`${page.cat}&${page.post}`);
  }
})();

if (config.unreadIndicator) window.addEventListener("focus", page.updateTitle);
