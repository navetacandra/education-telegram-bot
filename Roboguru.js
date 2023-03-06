const puppeteer = require("puppeteer-core");
const fetch = (...args) =>
import("node-fetch").then(({
  default: fetch
  }) => fetch(...args));
  const fs = require("fs");

  class Roboguru {
    constructor() {
      this.grade = [{
        id: 1,
        name: "sd",
        serial: "94LL64YTJA"
      },
        {
          id: 2,
          name: "smp",
          serial: "XHAGLMC2TA"
        },
        {
          id: 3,
          name: "sma",
          serial: "3GAWQ3PJRB"
        },
        {
          id: 4,
          name: "utbk",
          serial: "489EUDXNA8"
        },
      ];

      this.subject = [{
        name: "matematika",
        serial: "94LL64YTJA",
        id: 1
      },
        {
          name: "bahasa indonesia",
          serial: "94LL64YTJA",
          id: 2
        },
        {
          name: "ipa terpadu",
          serial: "94LL64YTJA",
          id: 3
        },
        {
          name: "penjaskes",
          serial: "94LL64YTJA",
          id: 4
        },
        {
          name: "ppkn",
          serial: "94LL64YTJA",
          id: 5
        },
        {
          name: "ips terpadu",
          serial: "94LL64YTJA",
          id: 6
        },
        {
          name: "seni",
          serial: "94LL64YTJA",
          id: 7
        },
        {
          name: "agama",
          serial: "94LL64YTJA",
          id: 8
        },
        {
          name: "bahasa daerah",
          serial: "94LL64YTJA",
          id: 9
        },
        {
          name: "fisika",
          serial: "XHAGLMC2TA",
          id: 10
        },
        {
          name: "biologi",
          serial: "XHAGLMC2TA",
          id: 11
        },
        {
          name: "bahasa inggris",
          serial: "XHAGLMC2TA",
          id: 12
        },
        {
          name: "geografi",
          serial: "XHAGLMC2TA",
          id: 13
        },
        {
          name: "sosiologi",
          serial: "XHAGLMC2TA",
          id: 14
        },
        {
          name: "sejarah",
          serial: "XHAGLMC2TA",
          id: 15
        },
        {
          name: "ekonomi",
          serial: "XHAGLMC2TA",
          id: 16
        },
        {
          name: "teknologi informasi",
          serial: "XHAGLMC2TA",
          id: 17
        },
        {
          name: "kimia",
          serial: "3GAWQ3PJRB",
          id: 18
        },
        {
          name: "kewirausahaan",
          serial: "3GAWQ3PJRB",
          id: 19
        },
      ];
      this.browser;
      this.page;
    }

    async initialize() {
      try {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-gpu"],
        });
        this.page = await this.browser.newPage();
        await this.page.goto("https://roboguru.ruangguru.com", {
          timeout: 0,
          waitUntil: "networkidle0",
        });
      } catch (e) {
        throw e;
      }
    }

    #getURL(grade_id, subject_id, question) {
      if (grade_id < 1 || grade_id > 4) {
        console.log("grade_id not found");
        return;
      }
      if (subject_id < 1 || subject_id > 19) {
        console.log("subject_id not found");
        return;
      }
      let grade = this.grade.filter((e) => e.id === grade_id)[0].serial;
      let subject = this.subject
      .filter((e) => e.id === subject_id)[0]
      .name.replace(" ", "-");

      let url = `https://roboguru.ruangguru.com/search?grade=${grade}&subject=${subject}&text=${encodeURIComponent(
        question
      )}`;

      return url;
    }

    async search(grade_id, subject_id, question) {
      if (grade_id < 1 || grade_id > 4) {
        throw "Error: grade not found";
      }
      if (subject_id < 1 || subject_id > 19) {
        throw "Error: subject not found";
      }
      if (question.trim().length < 1) {
        throw "Error: question is required";
      }

      let url = this.#getURL(grade_id, subject_id, question);
      let json_data;

      this.page.on("response", async (response) => {
        if (
          response
          .url()
          .startsWith(
            "https://roboguru.ruangguru.com/api/v3/roboguru-discovery/search/question"
          )
        ) {
          json_data = await response.json();
        }
      });

      await this.page.goto(url,
        {
          timeout: 0,
          waitUntil: "networkidle0",
        });
      let q_list = await json_data;
      if (!q_list.data.questions) {
        throw "Error: error while search";
      }

      let u_list = Array.from(
        new Set(
          q_list.data.questions.map(
            (e) => "https://roboguru.ruangguru.com/forum/" + e.slug
          )
        )
      );

      let ld_data = u_list.map(async (u) => {
        try {
          let html = await (await fetch(u)).text();
          if (!html.includes("application/ld+json")) {
            html = await (await fetch(u.replace("https://roboguru.ruangguru.com/forum/", "https://roboguru.ruangguru.com/question/"))).text();
          }
          let ld_json = html.split('<script type="application/ld+json">');
          if (ld_json.length < 2) return;

          return JSON.parse(ld_json[1].split("</script>")[0]);
        } catch (e) {
          throw e;
        }
      });

      let result = (await Promise.all(ld_data)).map((json) => {
        if (typeof json === "undefined") return;
        let main = json.mainEntity;
        const {
          acceptedAnswer,
          suggestedAnswer
        } = main;

        return {
          question: {
            text: main.text,
            image: main.image
          },
          answers: [acceptedAnswer ?? [],
            suggestedAnswer ?? []].flat().map(
            (e) => ({
              text: e.text, image: e.image
            })
          ),
        };
      });

      return result.filter((e) => typeof e !== "undefined");
    }
  }

  module.exports = Roboguru;