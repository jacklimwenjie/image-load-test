const puppeteer = require("puppeteer");

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

(async () => {
  try {
    console.time("Finish executing in");

    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto("https://staging-www.yummybros.com", {
      waitUntil: "networkidle0",
    });

    await page.setViewport({ width: 1200, height: 800 });

    await autoScroll(page);

    // wait for all images to finish loading
    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll("img"));

      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return;

          return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", reject);
          });
        })
      );
    });

    // dismiss popup that could block the scrolling of the page
    const sumoPopupCloseButton = await page.$(
      "body > div.sumo-form-wrapper.listbuilder-popup > div.listbuilder-popup-content > div > div > div > span > div > div.sumome-react-wysiwyg-component.sumome-react-wysiwyg-outside-horizontal-resize-handles.sumome-react-wysiwyg-outside-vertical-resize-handles.sumome-react-wysiwyg-close-button.sumome-react-wysiwyg-popup-image.sumome-react-wysiwyg-image > div > div"
    );
    if (sumoPopupCloseButton) await sumoPopupCloseButton.click();

    await page.screenshot({ path: "./ss.png", fullPage: true });

    await browser.close();

    console.timeEnd("Finish executing in");
  } catch (err) {
    console.log("something went wrong", err.message);
  }
})();
