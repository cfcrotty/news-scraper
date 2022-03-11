$(document).ready(function () {
  var articleContainer = $(".article-container");
  var clothesContainer = $("#clothesContainer");
  $(document).on("click", ".btn.save", handleArticleSave);
  $(document).on("click", ".scrape-new", handleArticleScrape);
  //$(document).on("click", ".scrape-new-2", handleArticleScrape2);
  $(document).on("click", ".scrape-clothes", handleClothingScrape);
  $(".clear").on("click", handleArticleClear);
  $(".clearClothes").on("click", handleClothesClear);
  $(document).on("click", ".btn.saveDress", handleClothesSave);

  function initPage() {
    $.get("/api/headlines?saved=false").then(function (data) {
      articleContainer.empty();
      if (data && data.length) {
        renderArticles(data);
      } else {
        renderEmpty();
      }
    });
  }

  function renderArticles(articles) {
    var articleCards = [];
    for (var i = 0; i < articles.length; i++) {
      articleCards.push(createCard(articles[i]));
    }
    articleContainer.append(articleCards);
  }

  function createCard(article) {
    var card = $("<div class='card'>");
    var cardHeader = $("<div class='card-header'>").append(
      $("<h3>").append(
        $("<a class='article-link' target='_blank' rel='noopener noreferrer'>")
          .attr("href", article.link)
          .text(article.title),
        $("<a class='btn btn-success save'>Save Article</a>")
      )
    );

    var cardBody = $("<div class='card-body'>").text(article.summary);

    card.append(cardHeader, cardBody);
    card.data("_id", article._id);
    return card;
  }

  function renderEmpty() {
    var emptyAlert = $(
      [
        "<div class='alert alert-warning text-center'>",
        "<h4>Uh Oh. Looks like we don't have any new articles.</h4>",
        "</div>",
        "<div class='card'>",
        "<div class='card-header text-center'>",
        "<h3>What Would You Like To Do?</h3>",
        "</div>",
        "<div class='card-body text-center'>",
        "<h4><a class='scrape-new'>Try Scraping New Articles</a></h4>",
        "<h4><a href='/saved'>Go to Saved Articles</a></h4>",
        "</div>",
        "</div>"
      ].join("")
    );
    articleContainer.append(emptyAlert);
  }

  function handleArticleSave() {
    var articleToSave = $(this)
      .parents(".card")
      .data();

    $(this)
      .parents(".card")
      .remove();

    articleToSave.saved = true;
    $.ajax({
      method: "PUT",
      url: "/api/headlines/" + articleToSave._id,
      data: articleToSave
    }).then(function (data) {
      if (data.saved) {
        initPage();
      }
    });
  }

  function handleArticleScrape() {
    $.get("/api/fetch").then(function (data) {
      initPage();
      bootbox.alert($("<h3 class='text-center m-top-80'>").text(data.message));
    });
  }

  /*function handleArticleScrape2() {
    $.get("/api/fetch2").then(function (data) {
      initPage();
      bootbox.alert($("<h3 class='text-center m-top-80'>").text(data.message));
    });
  }*/

  function handleArticleClear() {
    let confirmRemove = confirm("Are you sure you want to remove scraped articles?");
    if (!confirmRemove) return;
    $.get("api/clear/"+false).then(function () {
      articleContainer.empty();
      initPage();
    });
  }

  function renderClothes(clothes) {
    var clothesCards = [];
    for (let i = 0; i < clothes.length; i++) {
      clothesCards.push(createCardClothes(clothes[i]));
    }
    let clothesVar = $('<div class="card-header" id="clothes">').append(clothesCards);
    let clothesVar1 = $("<div class='card'>").append(clothesVar);
    clothesContainer.append(clothesVar1);
  }

  function initPageClothes() {
    $.get("/api/clothes?saved=false").then(function (data) {
      clothesContainer.empty();
      if (data && data.length) {
        renderClothes(data);
      }
    });
  }

  function createCardClothes(clothes) {
    let card = $("<div class='card card1'>");
    var cardHeader = $("<div class='clothes1'>").append(
      $(`<a class='article-link' target='_blank' rel='noopener noreferrer' href="${clothes.link}">`).append(
        $(`<img class='clothes' src="${clothes.summary}">`)
      )
    );

    card.append(cardHeader);
    card.append($("<span class='title'>").text(clothes.title));
    card.append($("<a class='btn btn-success saveDress'>Save Dress</a>"));
    card.data("_id", clothes._id);
    return card;
  }

  function handleClothingScrape() {
    $.get("/api/fetch/clothes").then(function (data) {
      initPageClothes();
      bootbox.alert($("<h3 class='text-center m-top-80'>").text(data.message));
    });
  }

  function handleClothesClear() {
    let confirmRemove = confirm("Are you sure you want to remove scraped clothes?");
    if (!confirmRemove) return;
    //$.get("api/clear/clothes")
    $.ajax({
      method: "DELETE",
      url: "api/clear/clothes/"+false
    })
    .then(function () {
      clothesContainer.empty();
      initPageClothes();
    });
  }

  function handleClothesSave() {
    var clothesToSave = $(this)
      .parents(".card")
      .data();

    $(this)
      .parents(".card")
      .remove();

    clothesToSave.saved = true;
    $.ajax({
      method: "PUT",
      url: "/api/clothes/" + clothesToSave._id,
      data: clothesToSave
    }).then(function (data) {
      if (data.saved) {
        initPageClothes();
      }
    });
  }
});
