function showPreviousShortenUrl() {
  $("ul").html("");
  $.get("/get/short-link-storage", (data, status) => {
    data.forEach(element => {
      const dataInDOM = `<li>${element.url} - <a href="${element.shortenUrl}" target="_blank">${element.shortenUrl}</a></li>`;
      $("ul").html($("ul").html() + dataInDOM);
    });
  });
}

$(document).ready(() => {
  showPreviousShortenUrl();
  $("form").submit(e => {
    e.preventDefault();
    $("span").html(`creating...`);
    const link = $('input[name="link"]').val();
    $.post("/post/short-link-generator", { link }, (data, status) => {
      if (data.err) {
        $("span").html(data.err);
      }
      if (data.shortenUrl) {
        $("span").html(data.shortenUrl);
        showPreviousShortenUrl();
      }
    });
  });
});
