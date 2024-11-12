const url = window.location.search;
const urlSearch = new URLSearchParams(url);
const id = urlSearch.get("id");
const type = urlSearch.get("type");

var setData = [];
var currentWord = "";
var num = 0;

function generateTitle() {
    const data = firebase.database().ref("/sets/" + type + "/" + id);

    data.once("value").then((snapshot) => {
        val = snapshot.val();
        document.getElementById("setName").innerHTML = val.name;
        document.getElementById("setAuthor").innerHTML = "By " + val.author;

        snapshot.val().terms.forEach((childSnapshot) => {
            if (type == "vocab") {
                setData.push(childSnapshot);
            } else if (type == "conjugation") {
                for (var i = 0; i < childSnapshot.length - 1; i++) {
                    formattedData = {"term": childSnapshot[i][0], "definition": childSnapshot[i][1]};
                    setData.push(formattedData);
                }
            }
        })
        setData = setData.map(val => ({val, sort: Math.random()})).sort((a,b) => a.sort-b.sort).map(({val}) => [val.term, val.definition]);
        generateWord();
    })
}

function generateWord() {
    if (!setData[num + 1]) {
        shuffleTerms();
        num = 0;
    } else {
        num++;
    }

    currentWord = setData[num];

    document.getElementById("otherSentences").replaceChildren();
    document.getElementById("input").value = "";
    document.getElementById("submit").style.display = "block";
    document.getElementById("input").style.display = "block";

    document.getElementById("word").innerHTML = currentWord[0] + " - " + currentWord[1];
}

function submitToBoard() {
    const sentences = firebase.database().ref("/sentences/" + id + "/" + setData[num][0]);
    var sentence = document.getElementById("input").value;

    document.getElementById("submit").style.display = "none";
    document.getElementById("input").style.display = "none";

    var newSentence = sentences.push();
    newSentence.set(sentence);
    sentences.once("value").then((snapshot) => {
        snapshot.forEach(element => {
            var container = document.createElement("div");
                container.setAttribute("class", "bg-french-blue text-white m-2 rounded-md p-2 md:p-4");

                var sent = document.createElement("span");
                sent.innerHTML = element.val();
                sent.setAttribute("class", "text-xl sm:text-2xl md:text-3xl font-semibold");;

                container.appendChild(sent);

                document.getElementById("otherSentences").appendChild(container);
        })
    })

}

function shuffleTerms() {
    setData = setData.map(val => ({val, sort: Math.random()})).sort((a,b) => a.sort-b.sort).map(({val}) => [val[0], val[1]]);
}