$(document).ready(function () {
  var articleContainer = $(".article-container");
  var clothesContainer = $("#clothesContainer");
  $(document).on("click", ".btn.delete", handleArticleDelete);
  $(document).on("click", ".btn.notes", handleArticleNotes);
  $(document).on("click", ".btn.save", handleNoteSave);
  $(document).on("click", ".btn.note-delete", handleNoteDelete);
  $(".clear").on("click", handleArticleClear);
  $(".clearClothes").on("click", handleClothesClear);
  $(document).on("click", ".btn.deleteDress", handleClothesDelete);

  function initPage() {
    $.get("/api/headlines?saved=true").then(function (data) {
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
        $("<a class='btn btn-danger delete'>Delete From Saved</a>"),
        $("<a class='btn btn-info notes'>Article Notes</a>")
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
        "<h4>Uh Oh. Looks like we don't have any saved articles.</h4>",
        "</div>",
        "<div class='card'>",
        "<div class='card-header text-center'>",
        "<h3>Would You Like to Browse Available Articles?</h3>",
        "</div>",
        "<div class='card-body text-center'>",
        "<h4><a href='/'>Browse Articles</a></h4>",
        "</div>",
        "</div>"
      ].join("")
    );
    articleContainer.append(emptyAlert);
  }

  function renderNotesList(data) {
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      currentNote = $("<li class='list-group-item'>No notes for this article yet.</li>");
      notesToRender.push(currentNote);
    } else {
      for (var i = 0; i < data.notes.length; i++) {
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        currentNote.children("button").data("_id", data.notes[i]._id);
        notesToRender.push(currentNote);
      }
    }
    $(".note-container").append(notesToRender);
  }

  function handleArticleDelete() {
    var articleToDelete = $(this)
      .parents(".card")
      .data();

    $(this)
      .parents(".card")
      .remove();
    $.ajax({
      method: "DELETE",
      url: "/api/headlines/" + articleToDelete._id
    }).then(function (data) {
      if (data.ok) {
        initPage();
      }
    });
  }
  function handleArticleNotes(event) {
    var currentArticle = $(this)
      .parents(".card")
      .data();
    $.get("/api/notes/" + currentArticle._id).then(function (data) {
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );

      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: currentArticle._id,
        notes: data || []
      };
      $(".btn.save").data("article", noteData);
      renderNotesList(noteData);
    });
  }

  function handleNoteSave() {
    var noteData;
    var newNote = $(".bootbox-body textarea")
      .val()
      .trim();
    if (newNote) {
      noteData = { _headlineId: $(this).data("article")._id, noteText: newNote };
      $.post("/api/notes", noteData).then(function () {
        bootbox.hideAll();
      });
    }
  }

  function handleNoteDelete() {
    var noteToDelete = $(this).data("_id");
    $.ajax({
      url: "/api/notes/" + noteToDelete,
      method: "DELETE"
    }).then(function () {
      bootbox.hideAll();
    });
  }

  function handleArticleClear() {
    let confirmRemove = confirm("Are you sure you want to remove saved articles?");
    if (!confirmRemove) return;
    $.get("api/clear/"+true)
      .then(function () {
        articleContainer.empty();
        initPage();
      });
  }

  function initPageClothes() {
    $.get("/api/clothes?saved=true").then(function (data) {
      clothesContainer.empty();
      if (data && data.length) {
        renderClothes(data);
      }
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

  function createCardClothes(clothes) {
    let card = $("<div class='card card1'>");
    var cardHeader = $("<div class='clothes1'>").append(
      $(`<a class='article-link' target='_blank' rel='noopener noreferrer' href="${clothes.link}">`).append(
        $(`<img class='clothes' src="${clothes.summary}">`)
      )
    );

    card.append(cardHeader);
    card.append($("<span class='title'>").text(clothes.title));
    card.append($("<a class='btn btn-danger deleteDress'>Delete From Saved</a>"));
    card.data("_id", clothes._id);
    return card;
  }

  function handleClothesClear() {
    let confirmRemove = confirm("Are you sure you want to remove saved clothes?");
    if (!confirmRemove) return;
    //$.get("api/clear/clothes")
    $.ajax({
      method: "DELETE",
      url: "api/clear/clothes/"+true
    })
    .then(function () {
      clothesContainer.empty();
      initPageClothes();
    });
  }

  function handleClothesDelete() {
    var clothesToDelete = $(this)
      .parents(".card")
      .data();

    $(this)
      .parents(".card")
      .remove();
    $.ajax({
      method: "DELETE",
      url: "/api/clothes/" + clothesToDelete._id
    }).then(function (data) {
      if (data.ok) {
        initPageClothes();
      }
    });
  }
});

