const url = window.location.search;
const urlSearch = new URLSearchParams(url);
const id = urlSearch.get("id");
const type = urlSearch.get("type");

var setData = [];
var termsBetweenReview = 0;
var termsWithoutReview = 0;
var allowOverrides = false;
var currentQuestion = [];
var incorrectTerms = [];
var countAccents = true;
var onAnswerScreen = false;
var termsSuggestReview = [];
var isRight = false;

var enterClicks = 0;

function generateTitle() {
    const data = firebase.database().ref("/sets/" + type + "/" + id);

    data.once("value").then((snapshot) => {
        val = snapshot.val();
        document.getElementById("setName").innerHTML = val.name;
        document.getElementById("setAuthor").innerHTML = "By " + val.author;
        document.getElementById("questions").max = val.totalTerms;
        if (type == "conjugation") {
            document.getElementById("questions").max = val.totalTerms * 7;
        }
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
    })
}

function generateQuestions() {
        // quiz parameters
        termsBetweenReview = document.getElementById("questions").value;
        allowOverrides = Boolean(document.querySelector("input[type='radio'][name=override]:checked").value);
        countAccents = Boolean(document.querySelector("input[type='radio'][name=accents]:checked").value);

        if (termsBetweenReview < 4) {
            alert("Number of terms between review must be greater than 3");
            return;
        } else if (termsBetweenReview > Number(document.getElementById("questions").max)) {
            alert("Number of terms between review of missed terms is too high, max is: " + document.getElementById("questions").max);
            return;
        }

        document.getElementById("setup").style.display = "none";
        document.getElementById("typing").style.display = "block";

        document.getElementById("input").addEventListener("keyup", function(e) {
            if (e.key == "Enter" && onAnswerScreen == false && this.value.trim().length > 0) {
                onAnswerScreen = true;
                this.readOnly = true;
                answerQuestion(this.value.trim());
            } else if (e.key == "Enter" && onAnswerScreen == true) {

                isRight = this.value.trim().toUpperCase() == currentQuestion.term.toUpperCase();

                if (!countAccents) {
                    isRight = this.value.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == currentQuestion.term.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                }

                document.getElementById("input").readOnly = false;
                document.getElementById("input").classList.remove("bg-green-700");
                document.getElementById("input").classList.remove("bg-french-red");

                if (!isRight) {
                    incorrectTerms.push(currentQuestion);
                }
                onAnswerScreen = false;
                if (termsWithoutReview != termsBetweenReview) {
                    termsWithoutReview++;
                }
                document.getElementById("optionContainer").remove();
                document.getElementById("input").value = "";

                askQuestion();
                if (currentQuestion == incorrectTerms[0] && incorrectTerms.length > 0 && termsWithoutReview == termsBetweenReview) {
                    incorrectTerms.shift();
                }
            }
        })

        setData = setData.map(val => ({val, sort: Math.random()})).sort((a,b) => a.sort - b.sort).map(({val}) => val);
        askQuestion();
}

function askQuestion() {
    if (setData.length == 0) {
        termsWithoutReview = termsBetweenReview;
    }
    
    if (termsWithoutReview != termsBetweenReview && setData.length > 0) {
        currentQuestion = setData.pop();
        document.getElementById("question").innerHTML = currentQuestion.definition;
        document.getElementById("input").focus();
        document.getElementById("input").select();
    } else {
        if (incorrectTerms.length > 0) {
            currentQuestion = incorrectTerms[0];
            document.getElementById("question").innerHTML = currentQuestion.definition;
            document.getElementById("input").focus();
            document.getElementById("input").select();
        } else {
            if (setData.length == 0) {
                finishTyping();
            } else {
                termsWithoutReview = 0;
                askQuestion();
            }
        }
    }
}

function answerQuestion(answer) {
    var container = document.getElementById("typing");
    var subcontainer = document.createElement("div");
    subcontainer.setAttribute("id", "optionContainer");
    subcontainer.setAttribute("class", "mx-auto text-center");

    var next = document.createElement("div");
    next.innerHTML = "Next question";
    next.setAttribute("class", "text-white hover:underline decoration-amber my-1 text-xl md:text-2xl");

    isRight = answer.toUpperCase() == currentQuestion.term.toUpperCase();

    if (!countAccents) {
        isRight = answer.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == currentQuestion.term.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (isRight) {
        document.getElementById("input").classList.add("bg-green-700");
    } else {
        var correctAnswer = document.createElement("div");
        correctAnswer.innerHTML = currentQuestion.term;
        correctAnswer.setAttribute("class", "text-2xl md:text-3xl text-center rounded-md bg-green-700 my-3");
        correctAnswer.setAttribute("id", "rightAns");
        subcontainer.appendChild(correctAnswer);

        document.getElementById("input").classList.add("bg-french-red");
        
        next.addEventListener("click", function() {
            incorrectTerms.push(currentQuestion);
            document.getElementById("input").classList.remove("bg-french-red");
        })

        if (termsSuggestReview.indexOf(currentQuestion) < 0) {
            termsSuggestReview.push(currentQuestion);
        }

        if (allowOverrides) {

            var override = document.createElement("div");
            override.innerHTML = "I got it right, override";
            override.setAttribute("class", "bg-french-blue hover:underline decoration-amber my-1 text-xl md:text-2xl");
            override.addEventListener("click", function() {
                termsSuggestReview.pop();

                document.getElementById("input").classList.remove("bg-french-red");
                document.getElementById("input").readOnly = false;
                onAnswerScreen = false;
                if (termsWithoutReview != termsBetweenReview) {
                    termsWithoutReview++;
                } else if (incorrectTerms.length > 0) {
                    incorrectTerms.shift();
                }
                document.getElementById("optionContainer").remove();
                document.getElementById("input").value = "";
                askQuestion();
            })

            subcontainer.appendChild(override);
        }
    }

    next.addEventListener("click", function() {
        document.getElementById("input").readOnly = false;
        document.getElementById("input").classList.remove("bg-green-700");

        onAnswerScreen = false;
        if (termsWithoutReview != termsBetweenReview) {
            termsWithoutReview++;
        }
        document.getElementById("optionContainer").remove();
        document.getElementById("input").value = "";

        askQuestion();
        if (currentQuestion == incorrectTerms[0] && incorrectTerms.length > 0 && termsWithoutReview == termsBetweenReview) {
            incorrectTerms.shift();
        }
    })

    subcontainer.appendChild(next);
    container.appendChild(subcontainer);
}

function finishTyping() {
    document.getElementById("typing").style.display = "none";

    var container = document.createElement("div");
    container.setAttribute("class", "bg-french-blue text-white w-11/12 md:w-5/12 mx-auto my-4 rounded-md p-2");
    container.setAttribute("id", "finalScreen");

    var header = document.createElement("div");
    
    var randNum = Math.floor(Math.random() * 5);
    if (randNum == 0) {
        header.innerHTML = "Great!";
    } else if (randNum == 1) {
        header.innerHTML = "Nice job!";
    } else if (randNum == 2) {
        header.innerHTML = "You're a wizard!";
    } else if (randNum == 3) {
        header.innerHTML = "Glitter-ific!";
    } else if (randNum == 4) {
        header.innerHTML = "They grow up so fast.";
    }

    header.setAttribute("class", "text-3xl lg:text-4xl px-2 pt-1 text-center font-semibold");

    var lineBreak = document.createElement("hr");
    lineBreak.setAttribute("class", "border-amber border-[1px] xl:border-2 rounded-full my-2");

    container.appendChild(header);
    container.appendChild(lineBreak);

    if (termsSuggestReview.length > 0) {

        var suggestion = document.createElement("div");
        suggestion.setAttribute("class", "text-xl lg:tet-2xl px-2 pt-1 text-center");

        if (termsSuggestReview.length == 1) {
            suggestion.innerHTML = "You might want to review this term:";
        } else {
            suggestion.innerHTML = "You might want to review these terms:";
        }
        container.appendChild(suggestion);

        for (var i = 0; i < termsSuggestReview.length; i++) {
            var termContainer = document.createElement("div");
            termContainer.setAttribute("class", "bg-button-blue m-2 rounded-md p-2");
            
            var term = document.createElement("span");
            term.innerHTML = termsSuggestReview[i].term;
            term.setAttribute("class", "text-2xl md:text-3xl font-semibold");

            var dash = document.createElement("span");
            dash.innerHTML = " - ";
            dash.setAttribute("class", "text-2xl md:text-3xl font-semibold text-french-red");
    
            var definition = document.createElement("span");
            definition.innerHTML = termsSuggestReview[i].definition;
            definition.setAttribute("class", "text-2xl md:text-3xl font-semibold");

            termContainer.appendChild(term);
            termContainer.appendChild(dash);
            termContainer.appendChild(definition);
            container.appendChild(termContainer);
        }
    } else {
        var noIncorrect = document.createElement("div");
        noIncorrect.setAttribute("class", "text-white text-xl lg:text-2xl px-2 pt-1 text-center");
        noIncorrect.innerHTML = "You didn't miss any terms!";
        container.appendChild(noIncorrect);
    }

    document.getElementById("results").appendChild(container);

    var playAgain = document.createElement("div");
    playAgain.innerHTML = "Play again";
    playAgain.setAttribute("class", "text-white w-11/12 md:w-1/3 bg-french-blue text-center py-1 rounded-md mx-auto text-xl sm:text-2xl xl:text-3xl hover:cursor-pointer hover:underline decoration-amber");
    playAgain.addEventListener("click", function() {
        window.location.reload();
    });

    document.getElementById("results").appendChild(playAgain);

    var home = document.createElement("div");
    home.innerHTML = "View other games";
    home.setAttribute("class", "text-white w-11/12 md:w-1/3 my-2 bg-french-blue text-center py-1 rounded-md mx-auto text-xl sm:text-2xl xl:text-3xl hover:cursor-pointer hover:underline decoration-amber");
    home.addEventListener("click", function() {
        goBackFromGame();
    });

    document.getElementById("results").appendChild(home);
}