const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

class Brainly {
  constructor() {}

  async #fetch(url = "", result = "text") {
    let res = await fetch(url);
    return {
      status: res.status,
      data: await res[result](),
    };
  }

  async search(keyword = "") {
    let url = `https://brainly.co.id/graphql/id?operationName=SearchPage&variables={"query":"${encodeURIComponent(
      keyword
    )}","after":null,"first":10}&extensions={"persistedQuery":{"version":1,"sha256Hash":"2e22c88f25e89f006d83db5d97c30bcd5163b2b08619ac1807e67fb6eb4e059e"}}`;
    let { data: searchResult } = await this.#fetch(url, "json");
    let data = searchResult.data.questionSearch.edges.map(async (el) => {
      let id = el.node.databaseId,
        question = el.highlight.contentFragments[0]
          .replace(/\<em\>/g, "")
          .replace(/\<\/em\>/g, ""),
        hasVerified = el.node.answers.hasVerified,
        isConfirmed = el.node.answers.nodes[0].isConfirmed,
        answerCount = 0;

      let { data: pageResult } = await this.#fetch(
        `https://brainly.co.id/tugas/${id}`,
        "text"
      );
      let ldData = JSON.parse(
        pageResult
          .split('<script type="application/ld+json">')[1]
          .split("</script>")[0]
      )[0].mainEntity;
      let wjsData = JSON.parse(
        pageResult.split("window.jsData.question = ")[1].split("\n")[0]
      );

      ldData.answers = [];
      if (ldData.hasOwnProperty("acceptedAnswer")) {
        for (let i = 0; i < ldData.acceptedAnswer.length; i++) {
          ldData.answers.push(ldData.acceptedAnswer[i]);
        }
      }
      if (ldData.hasOwnProperty("suggestedAnswer")) {
        for (let i = 0; i < ldData.suggestedAnswer.length; i++) {
          ldData.answers.push(ldData.suggestedAnswer[i]);
        }
      }

      wjsData.content = question;

      delete wjsData.databaseId;
      delete wjsData.created;
      delete wjsData.isClosed;
      delete wjsData.isClosed;
      delete wjsData.isAnswerButton;
      delete wjsData.points;
      delete wjsData.pointsForBest;
      delete wjsData.comments;

      wjsData.author.name = wjsData.author.nick;
      wjsData.subject.id = wjsData.subject.databaseId;
      wjsData.grade.id = wjsData.grade.databaseId;

      delete wjsData.author.nick;
      delete wjsData.author.avatar;
      delete wjsData.subject.databaseId;
      delete wjsData.grade.databaseId;

      for (let i = 0; i < wjsData.attachments.length; i++) {
        wjsData.attachments[i].url = wjsData.attachments[i].full;

        delete wjsData.attachments[i].thumbnail;
        delete wjsData.attachments[i].full;
      }

      for (let i = 0; i < wjsData.answers.length; i++) {
        wjsData.answers[i].author = wjsData.answers[i].user;
        wjsData.answers[i].author.name = wjsData.answers[i].author.nick;

        delete wjsData.answers[i].author.avatar;
        delete wjsData.answers[i].author.nick;
        delete wjsData.answers[i].author.isDeleted;
        delete wjsData.answers[i].user;
        delete wjsData.answers[i].databaseId;
        delete wjsData.answers[i].created;
        delete wjsData.answers[i].comments;

        let answer = ldData.answers.filter(
          (ans) => ans.author.name === wjsData.answers[i].author.name
        )[0];
        wjsData.answers[i].content = answer.text;

        for (let j = 0; j < wjsData.answers[i].attachments.length; j++) {
          wjsData.answers[i].attachments[j].url =
            wjsData.answers[i].attachments[j].full;

          delete wjsData.answers[i].attachments[j].thumbnail;
          delete wjsData.answers[i].attachments[j].full;
        }

        answerCount++;
      }

      return {
        id,
        hasVerified,
        isConfirmed,
        answerCount,
        ...wjsData,
      };
    });
    return await Promise.all(data);
  }

  async searchAll(keyword = "") {
    let start_url = `https://brainly.co.id/graphql/id?operationName=SearchPage&variables={"query":"${encodeURIComponent(
      keyword
    )}","after":null,"first":10}&extensions={"persistedQuery":{"version":1,"sha256Hash":"2e22c88f25e89f006d83db5d97c30bcd5163b2b08619ac1807e67fb6eb4e059e"}}`;
    let { data: searchResult1 } = await this.#fetch(start_url, "json");
    let count = searchResult1.data.questionSearch.count;

    if (count > 100) {
      console.log("[WARNING] Data question more than 100!");
      console.log("[MESSAGE] System only can get 100 data...\n\n");
    }

    let list_data = [];
    for (let i = 0; i < 5; i++) {
      let url = `https://brainly.co.id/graphql/id?operationName=SearchPage&variables={"query":"${encodeURIComponent(
        keyword
      )}","after":${
        i > 0
          ? '"' +
            Buffer.from("cursor:" + i * 10, "binary").toString("base64") +
            '"'
          : "null"
      },"first":10}&extensions={"persistedQuery":{"version":1,"sha256Hash":"2e22c88f25e89f006d83db5d97c30bcd5163b2b08619ac1807e67fb6eb4e059e"}}`;
      let { data: searchResult } = await this.#fetch(url, "json");
      list_data[i] = searchResult;
    }
    list_data = list_data
      .flat()
      .map((el) => el.data.questionSearch.edges)
      .flat();

    let data = list_data.map(async (el) => {
      let id = el.node.databaseId,
        question = el.highlight.contentFragments[0]
          .replace(/\<em\>/g, "")
          .replace(/\<\/em\>/g, ""),
        hasVerified = el.node.answers.hasVerified,
        isConfirmed = el.node.answers.nodes[0].isConfirmed,
        answerCount = 0;

      let { data: pageResult } = await this.#fetch(
        `https://brainly.co.id/tugas/${id}`,
        "text"
      );
      let ldData = JSON.parse(
        pageResult
          .split('<script type="application/ld+json">')[1]
          .split("</script>")[0]
      )[0].mainEntity;
      let wjsData = JSON.parse(
        pageResult.split("window.jsData.question = ")[1].split("\n")[0]
      );

      ldData.answers = [];
      if (ldData.hasOwnProperty("acceptedAnswer")) {
        for (let i = 0; i < ldData.acceptedAnswer.length; i++) {
          ldData.answers.push(ldData.acceptedAnswer[i]);
        }
      }
      if (ldData.hasOwnProperty("suggestedAnswer")) {
        for (let i = 0; i < ldData.suggestedAnswer.length; i++) {
          ldData.answers.push(ldData.suggestedAnswer[i]);
        }
      }

      wjsData.content = question;

      delete wjsData.databaseId;
      delete wjsData.created;
      delete wjsData.isClosed;
      delete wjsData.isClosed;
      delete wjsData.isAnswerButton;
      delete wjsData.points;
      delete wjsData.pointsForBest;
      delete wjsData.comments;

      wjsData.author.name = wjsData.author.nick;
      wjsData.subject.id = wjsData.subject.databaseId;
      wjsData.grade.id = wjsData.grade.databaseId;

      delete wjsData.author.nick;
      delete wjsData.author.avatar;
      delete wjsData.subject.databaseId;
      delete wjsData.grade.databaseId;

      for (let i = 0; i < wjsData.attachments.length; i++) {
        wjsData.attachments[i].url = wjsData.attachments[i].full;

        delete wjsData.attachments[i].thumbnail;
        delete wjsData.attachments[i].full;
      }

      for (let i = 0; i < wjsData.answers.length; i++) {
        wjsData.answers[i].author = wjsData.answers[i].user;
        wjsData.answers[i].author.name = wjsData.answers[i].author.nick;

        delete wjsData.answers[i].author.avatar;
        delete wjsData.answers[i].author.nick;
        delete wjsData.answers[i].author.isDeleted;
        delete wjsData.answers[i].user;
        delete wjsData.answers[i].databaseId;
        delete wjsData.answers[i].created;
        delete wjsData.answers[i].comments;

        let answer = ldData.answers.filter(
          (ans) => ans.author.name === wjsData.answers[i].author.name
        )[0];
        wjsData.answers[i].content = answer.text;

        answerCount++;
      }

      return {
        id,
        hasVerified,
        isConfirmed,
        answerCount,
        ...wjsData,
      };
    });
    return await Promise.all(data);
  }
}

module.exports = Brainly;
