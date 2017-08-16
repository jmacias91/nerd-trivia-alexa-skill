/**
 * Nerd Trivia is a trivia game focused on nerdy topics.
 * It's built with the Amazon Alexa Skills Kit for Node.js.
 * 
 *This product built referencing code from the following tutorials:
 *Alexa Sample Quiz Game (https://github.com/alexa/skill-sample-nodejs-quiz-game)
 *https://stackoverflow.com/questions/42186692/consuming-an-rest-api-with-node-js-for-a-aws-lambda-function
 *
 *Powered by Open Trivia DB (https://opentdb.com/)
 */

"use strict";
const Alexa = require("alexa-sdk"); 
const https = require('https');

//Replace with your app ID.
var APP_ID = undefined;

//List of categories with API ID. To add additional categories reference
//Open Trivia DB and add the category name and id here. Then update the
//Alexa skill list-of-categories-slotvalues in speech-assests.
const categories =  [
                        {CatName: "Video Games",  CatID: 15},
                        {CatName: "Books",        CatID: 10},
                        {CatName: "Films",        CatID: 11},
                        {CatName: "Comics",       CatID: 29},
                        {CatName: "Anime",        CatID: 31},
                        {CatName: "Cartoons",     CatID: 32},
                        {CatName: "Television",   CatID: 14},
                        {CatName: "History",      CatID: 23},
                        {CatName: "Mythology",    CatID: 20}
                    ];

/**
 * Holds url properties used to create Open Trivia DB Request in urlBuilder()
 * @param {int}    catID             ID the API uses to define a particular category.
 * @param {string} difficulty        Difficulty of question. To be implemented in later versions.
 * @param {string} type              Open Trivia DB supports true/false and multiple choice.
 *		                             Can be set to boolean, multiple, or any.
 * @param {int}    numberOfQuestions Number of questions to ask on the quiz.
 */
var urlProperties = {
                        catID: "", difficulty: "", type: "any", numberOfQuestions: 6
                    };


//List of speechcons to use when a user answers question correctly.
var speechConsCorrect = ["Booya", "All righty", "Bam", "Bazinga", "Bingo", "Bravo", "Cha Ching", "Cheers", "Hip hip hooray", "Hurrah", 
"Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap", "Phew", 
"Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa"];

//List of speechcons to use when a user answers question incorrectly.
var speechConsWrong = ["Aw man", "Blarg", "Blast", "Boo", "Darn", "D'oh", "Dun dun dun", "Eek", "Le sigh",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Uh oh", "Whoops a daisy"];

//This is the welcome message for when a user starts the skill without a specific intent.
var WELCOME_MESSAGE = "Welcome to Nerd Trivia! You can start a quiz or ask for a random trivia question. What would you like to do?";  

//This is the message a user will hear when they start random trivia.
var START_RANDOM_TRIVIA_MESSAGE = "Ok. Here is a random trivia question about";

//This is the message a user will hear when they start a quiz.
var START_QUIZ_MESSAGE = "Ok. I will ask you " + urlProperties.numberOfQuestions + " questions about";

//This is the message a user will hear if they try to pick another category, start another quiz, or start random trivia, once a quiz has started.
var QUIZ_IN_PROGRESS = "For yes or no questions reply with yes or no. For multiple choice questions, reply with a number. Or ask me to start over to restart the game";

//This is the message a user will hear if they try to start a quiz, or another random trivia session once random trivia has started.
var TRIVIA_IN_PROGRESS = "For yes or no questions reply with yes or no. For multiple choice questions, reply with a number. Or ask me to start over to restart the game.";

//This is the message a user will hear at the end of a random trivia round.
var PLAY_TRIVIA_AGAIN = "<break time='500ms'/> Thanks for playing! Ready for another? If you want another question say, give me random trivia. Or you can ask me to start a quiz.";

//This is the message a user will hear at the end of a quiz round.
var PLAY_QUIZ_AGAIN = "<break time='500ms'/> Thanks for playing! That was a fun quiz! If you want another quiz, ask me to start a quiz. You can also say, give me random trivia for a random trivia question!";

//This is the message a user will hear when they try to cancel or stop the skill.
var EXIT_SKILL_MESSAGE = "Thank you for playing Nerd Trivia! Hope to see you again soon!";

//This is the message a user will hear after getting a question.
var REPROMPT_MESSAGE = "I´m waiting for your answer. For yes or no questions reply with yes or no. For multiple choice questions, reply with a number.";

//This is the message a user will hear if they answer a multiple choice question with yes or no;
var MULTIPLE_MESSAGE = "Please answer with the number matching the answer you want to give.";

//This is the message a user will hear if they answer a yes or no question with a number;
var BOOLEAN_MESSAGE = "Please answer with yes or no.";

//This is the message a user will hear when they ask Alexa for help.
var HELP_MESSAGE = "I´m a trivia app. You can ask me for a random trivia question and I´ll find an interesting trivia question for you! You can also play a game by asking me to start a quiz and I´ll quiz you to test your knowledge. What would you like to do?";

//This is the message a user will hear if RepeatIntent is activated while not in a quiz or trivia session.
var REPEAT_ERROR_MESSAGE = "I'm sorry, it seems like there are no active quizzes or random trivia.";

//This is the message a user will hear if they try to pick a category without properly starting a quiz.
var CATEGORY_ERROR_MESSAGE = "If you want to take a quiz, please ask me to start a quiz. You can also say, give me random trivia for a random trivia question!";

//This is the message a user will hear when Alexa recieves an unhandled intent request.
var UNHANDLED_MESSAGE = "I'm sorry, I didn't catch that. For yes or no questions reply with yes or no. For multiple choice questions, reply with a number. Or you can ask me to start over to restart the game";

//This is the message a user will hear if there's a database error.
var DB_ERROR_MESSAGE = "There was a problem retrieving questions from the database. Please try again later.";

//Builds url for random trivia or quiz.
function urlBuilder(mode) 
{
    var url = "";

    if (mode == "random") {
        
        if(urlProperties.type == "any") {
            url = "https://opentdb.com/api.php?amount=1&category=" + urlProperties.catID + "&encode=url3986";
        } else {
            url = "https://opentdb.com/api.php?amount=1&category=" + urlProperties.catID + "&type=" + urlProperties.type + "&encode=url3986";
        }
    }

    if (urlProperties.type == "any") {
        url = "https://opentdb.com/api.php?amount=" + urlProperties.numberOfQuestions + "&category=" + urlProperties.catID + "&encode=url3986";
    } else {
        url = "https://opentdb.com/api.php?amount=" + urlProperties.numberOfQuestions + "&category=" + urlProperties.catID + "&type=" + urlProperties.type + "&encode=url3986";
    }

    return url;
}

//Makes call to Open Trivia DB.
const databaseCall = function(url) 
{
    return new Promise(function(resolve, reject) {

        var body = "";
        var data = "";

        var req = https.request(url, (res) => {

            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', () => {
                data = JSON.parse(body);
                var results = data.results;
                for (var i = 0; i < results.length; i++) {
                    results[i].question = format(results[i].question);
                    results[i].correct_answer = format(results[i].correct_answer);
                    for (var j = 0; j < results[i].incorrect_answers.length; j++) {
                        results[i].incorrect_answers[j] = format(results[i].incorrect_answers[j]);
                    }
                }
                resolve(results);
            });


        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

//Gets random int inclusive-exclusive.
function getRandom(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

//Gets question from data retrieved from Open Trivia DB.
function getQuestion(counter, questionStruct, answerMapping, card) 
{ 
    //for random trivia, since we're only asking one question
    if (counter == -1) {
        if (questionStruct.type.toLowerCase() == "boolean") {
            if (questionStruct.correct_answer.toLowerCase() == "true") {
                answerMapping.answer = "Yes";
            } else {
                answerMapping.answer = "No";
            }

            var response = questionStruct.question + "\n" + "Yes or No?";
            buildCardResponse(response, card);
            return questionStruct.question + ". " + "Yes or No?";
        }
        return getMultipleChoices(questionStruct, answerMapping, card);  
    }

    if (questionStruct.type.toLowerCase() == "boolean") {
        if (questionStruct.correct_answer.toLowerCase() == "true") {
                answerMapping.answer = "Yes";
        } else {
                answerMapping.answer = "No";
        }

        var response = questionStruct.question + "\n" + "Yes or No?";
        buildCardResponse(response, card);
        return "Here is your " + counter + "th question. " + questionStruct.question + ". " + "Yes or No?";
    }

    return "Here is your " + counter + "th question. " + getMultipleChoices(questionStruct, answerMapping, card);
}

//Gets choices for multiple choice questions.
function getMultipleChoices(questionStruct, answerMapping, card) 
{
    var multipleArray = questionStruct.incorrect_answers;
    multipleArray.push(questionStruct.correct_answer);
    multipleArray = shuffleArray(multipleArray);

    var response = questionStruct.question + "\n";
    var result = "";

    for (var i = 0; i < multipleArray.length; i++) {
        if (multipleArray[i] == questionStruct.correct_answer) {
            answerMapping.answer = String(i + 1);
        }

        if (i == (multipleArray.length - 1)) {
            result += "or " + String(i + 1) + ".<break strength='strong'/>" + multipleArray[i] + ".";
        } else {
            result += String(i + 1) + ".<break strength='strong'/>" + multipleArray[i] + ". ";
        }

        response += String(i + 1) + ". " + multipleArray[i] + "\n";
    }

    buildCardResponse(response, card);

    return questionStruct.question + " " + result;
}

//Shuffle array helper method.
function shuffleArray(array) 
{
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

//Gets answer for corresponding question.
function getAnswer(answer, answerMapping) 
{ 
    if (answer == "True" || answer == "False") {
        return " The answer is " + answerMapping.answer + ". ";
    }
    return " The answer is " + answerMapping.answer + ".<break strength='strong'/>" + answer + ". "; 
}

//Gets the card response
function buildCardResponse(content, card) { card.cardContent = content; }

//Gets the current score during a quiz.
function getCurrentScore(score, counter) { return "Your current score is " + score + " out of " + (counter * 10) + ". "; }

//Gets the final score after a quiz finishes.
function getFinalScore(score, counter) { return "Your final score is " + score + " out of " + (counter * 10) + "."; }

//Returns speechcons to use for answer reponses.
function getSpeechCon(type)
{
    var speechCon = "";
    if (type) return "<say-as interpret-as='interjection'>" + speechConsCorrect[getRandom(0, speechConsCorrect.length)] + "! </say-as><break strength='strong'/>";
    else return "<say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length)] + ". </say-as><break strength='strong'/>";    
}

//Returns list of categories.
function getCategoryPrompt(card)
{
	var speech = "Please choose a category. Here is the list you can choose from.";
    var response = "";

	for (var i = 0; i < categories.length; i++) {
		if (i == (categories.length - 1)) {
			speech += " and " + categories[i].CatName + ".";
		} else {
			speech += " " + categories[i].CatName + ".";
		}
        response += categories[i].CatName + "\n";
	}
    buildCardResponse(response, card);
	return speech;
}

//Makes sure category picked by user is valid
function getCategory(userPick)
{
	if (userPick.value != undefined) {
		return true;
	}
	
	return false;
}

//Compare answer given by user and correct answer.
function compareAnswers(slots, value, type)
{   
    for (var slot in slots) {
        if (slots[slot].value != undefined) {
            if (slots[slot].value.toString().toLowerCase() == value.toString().toLowerCase()) {
                return "true";
            }

            if (type == "multiple") {
                if (isNaN(slots[slot].value.toString())) {
                    return "invalid number";
                }
            } else if (type == "boolean") {
                if (!isNaN(slots[slot].value.toString())) {
                    return "invalid boolean";
                }
            }

            return "false";
        }
    }
    return "undefined";
}

//Format Open Trivia DB data
function format(value)
{
    var result = decodeURIComponent(value);

    if(result.includes("%")) {
        result = result.replace(/%/g, " percent ");
    }

    if(result.includes(">")) {
        result = result.replace(/>/g, " greater than ");
    }

    if(result.includes("<")) {
        result = result.replace(/</g, " less than ");
    }

    if(result.includes("&")) {
        result = result.replace(/&/g, " and ");
    }

    if(result.includes("_")) {
        result = result.replace(/_/g, " blank ");
    }

    return result;
}

//=========================================================================================================================================
//Flow Control logic below.  
//=========================================================================================================================================

var states = {
    START: "_START",
    QUIZ: "_QUIZ"
};

var hasStarted = {
    START: "IN PROGRESS",
    STOP: "ENDED"
};

const handlers = {
     "LaunchRequest": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
     },
     "RandomTriviaIntent": function() {
        this.handler.state = states.START;
        this.emitWithState("RandomTriviaIntent");
     },
     "CategoryIntent": function() {
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
     },
    "QuizIntent": function() {
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
    },
    "AMAZON.HelpIntent": function() {
        this.emit(":ask", HELP_MESSAGE, HELP_MESSAGE);
    },
    "Unhandled": function() {
        this.handler.state = states.START;
        this.emitWithState("Start");
    }
};

var startHandlers = Alexa.CreateStateHandler(states.START,{
    "Start": function() {
        this.emit(":ask", WELCOME_MESSAGE, HELP_MESSAGE);
    },
    "RandomTriviaIntent": function() {
         if (this.attributes["hasStarted"] == hasStarted.START) {
            this.emit(":ask", TRIVIA_IN_PROGRESS, REPROMPT_MESSAGE);
        }
        this.emitWithState("StartRandomTrivia");
    },
    "StartRandomTrivia": function() {
        this.attributes["hasStarted"] = hasStarted.START;
        this.attributes["mode"] = "random";
        var min = 0;
        var max = categories.length;
        var randomIndex = getRandom(min, max);
        var category = categories[randomIndex];
        urlProperties.catID = category.CatID;
        this.attributes["category"] = category.CatName;

        const url = urlBuilder(this.attributes["mode"]);

        databaseCall(url).then((results) => {
            this.attributes["questionList"] = results;
            this.emitWithState("AskQuestion");
        }).catch((err) => {
            console.error(err);
            this.emit(":tell", DB_ERROR_MESSAGE, DB_ERROR_MESSAGE);
        });

    },
    "AskQuestion": function() {
        var speechOutput = START_RANDOM_TRIVIA_MESSAGE + " " + this.attributes["category"] + ". ";
        this.attributes["currentQuestion"] = this.attributes["questionList"][0]; 
        this.attributes["answerMapping"] = {answer: ""};
        this.attributes["card"] = {cardTitle: "", cardContent: ""};
        this.attributes["card"].cardTitle = this.attributes["category"] + " " + "Question";

        var result = "";
        result = getQuestion(-1, this.attributes["currentQuestion"], this.attributes["answerMapping"], this.attributes["card"]);
        this.attributes["repeatQuestion"] = result;
        speechOutput += result;

        this.emit(":askWithCard", speechOutput, REPROMPT_MESSAGE, this.attributes["card"].cardTitle, this.attributes["card"].cardContent);
    },
    "AnswerIntent": function() {
        if (this.attributes["hasStarted"] != hasStarted.START) {
                var response = "I don't know too much about that.";
                this.emit(":ask", response + " " + HELP_MESSAGE, HELP_MESSAGE);
        }

        var response = "";
        var answer = this.attributes["currentQuestion"].correct_answer;
        var answerMapping = this.attributes["answerMapping"];
        var userPick = this.event.request.intent.slots;
        
        var userAnswer = compareAnswers(userPick, answerMapping.answer, this.attributes["currentQuestion"].type);

        if (userAnswer == "true") {
            response = getSpeechCon(true);
            response += "That's correct!";
        }
        else if (userAnswer == "false") {
            response = getSpeechCon(false);
            response += "That's incorrect!";
        } else if (userAnswer == "invalid number") {
            this.emit(":ask", MULTIPLE_MESSAGE, MULTIPLE_MESSAGE);
        } else if (userAnswer == "invalid boolean") {
            this.emit(":ask", BOOLEAN_MESSAGE, BOOLEAN_MESSAGE);
        } else {
            this.emit(":ask", REPROMPT_MESSAGE, REPROMPT_MESSAGE);
        }

        response += getAnswer(answer, answerMapping);
        this.attributes["hasStarted"] = hasStarted.STOP;
        this.emit(":ask", response + PLAY_TRIVIA_AGAIN, PLAY_TRIVIA_AGAIN);
    },
    "QuizIntent": function() {
        if (this.attributes["hasStarted"] == hasStarted.START) {
                this.emit(":ask", TRIVIA_IN_PROGRESS, REPROMPT_MESSAGE);
        }
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
    },
    "AMAZON.RepeatIntent": function() {
        if (this.attributes["hasStarted"] == hasStarted.START) {
                this.emit(":ask", this.attributes["repeatQuestion"], this.attributes["repeatQuestion"]);
        }
        this.emit(":ask", REPEAT_ERROR_MESSAGE + " " + HELP_MESSAGE, HELP_MESSAGE);  
    },
    "AMAZON.StartOverIntent": function() {
        this.attributes["hasStarted"] = hasStarted.STOP;
        this.emitWithState("Start");
    },
    "AMAZON.StopIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.CancelIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.HelpIntent": function() {
        this.emit(":ask", HELP_MESSAGE, HELP_MESSAGE);
    },
    "Unhandled": function() {
        this.emit(":ask", UNHANDLED_MESSAGE, UNHANDLED_MESSAGE);
    }
});

var quizHandlers = Alexa.CreateStateHandler(states.QUIZ,{
    "Quiz": function() {
        this.attributes["mode"] = "quiz";
        this.attributes["response"] = "";
        this.attributes["counter"] = 0;
        this.attributes["quizscore"] = 0;
        this.attributes["category"] = "";
        this.attributes["hasStarted"] = "";
        this.attributes["card"] = {cardTitle: "", cardContent: ""};

        this.attributes["card"].cardTitle = "Categories";
        var response = getCategoryPrompt(this.attributes["card"]);

        this.emit(":askWithCard", response, response, this.attributes["card"].cardTitle, this.attributes["card"].cardContent);
    },
     "QuizIntent": function() {
        if (this.attributes["hasStarted"] == hasStarted.START) {
                this.emit(":ask", QUIZ_IN_PROGRESS, REPROMPT_MESSAGE);
        }
        this.emitWithState("Quiz");
    },
    "RandomTriviaIntent": function() {
         if (this.attributes["hasStarted"] == hasStarted.START) {
                this.emit(":ask", QUIZ_IN_PROGRESS, REPROMPT_MESSAGE);
        }
        this.handler.state = states.START;
        this.emitWithState("StartRandomTrivia");
    },
    "CategoryIntent": function() {
        if (this.attributes["hasStarted"] == hasStarted.START) {
                this.emit(":ask", QUIZ_IN_PROGRESS, REPROMPT_MESSAGE);
        }

        if (this.attributes["hasStarted"] == hasStarted.STOP) {
            this.emit(":ask", CATEGORY_ERROR_MESSAGE, HELP_MESSAGE);
        }

       var userPick = this.event.request.intent.slots.Category;
      
        if (!getCategory(userPick)) {
            this.emitWithState("Quiz");
        } else {
            this.attributes["category"] = userPick.value.toString();
            this.attributes["hasStarted"] = hasStarted.START;
            this.emitWithState("GetQuestions");
        }
    },
    "GetQuestions": function() {
       for (var i = 0; i < categories.length; i++) {
                if (categories[i].CatName.toLowerCase() == this.attributes["category"].toLowerCase()){
                    this.attributes["category"] = categories[i].CatName;
                    urlProperties.catID = categories[i].CatID;
                }
       }    

        const url = urlBuilder(this.attributes["mode"]);

        databaseCall(url).then((results) => {
            this.attributes["questionList"] = results;
            this.emitWithState("AskQuestion");
        }).catch((err) => {
            console.error(err);
            this.emit(":tell", DB_ERROR_MESSAGE, DB_ERROR_MESSAGE);
        });
    },
    "AskQuestion": function() {
        var speechOutput = "";

        if (this.attributes["counter"] === 0) {
            this.attributes["response"] = START_QUIZ_MESSAGE + " " + this.attributes["category"] + ". ";
        } 

        this.attributes["currentQuestion"] = this.attributes["questionList"][this.attributes["counter"]];
        this.attributes["counter"]++;
        this.attributes["answerMapping"] = {answer: ""};
        this.attributes["card"].cardTitle = this.attributes["category"] + " " + "Question";

        var result = getQuestion(this.attributes["counter"], this.attributes["currentQuestion"], this.attributes["answerMapping"], this.attributes["card"]);
        this.attributes["repeatQuestion"] = result;
        speechOutput = this.attributes["response"] + result;

        this.emit(":askWithCard", speechOutput, REPROMPT_MESSAGE, this.attributes["card"].cardTitle, this.attributes["card"].cardContent);
    },
    "AnswerIntent": function() {
        if (this.attributes["hasStarted"] != hasStarted.START){
                var response = "I don't know too much about that. If you want to take a quiz." + " " + getCategoryPrompt(this.attributes["card"]);
                this.emit(":askWithCard", response, response, this.attributes["card"].cardTitle, this.attributes["card"].cardContent);
        }

    	var response = "";
        var answer = this.attributes["currentQuestion"].correct_answer;
        var answerMapping = this.attributes["answerMapping"];
        var userPick = this.event.request.intent.slots;
        
        var userAnswer = compareAnswers(userPick, answerMapping.answer, this.attributes["currentQuestion"].type);

        if (userAnswer == "true") {
            response = getSpeechCon(true);
            response += "That's correct!";
            this.attributes["quizscore"] += 10;
        } else if (userAnswer == "false") {
            response = getSpeechCon(false);
            response += "That's incorrect!";
        } else if (userAnswer == "invalid number") {
            this.emit(":ask", MULTIPLE_MESSAGE, MULTIPLE_MESSAGE);
        } else if (userAnswer == "invalid boolean") {
            this.emit(":ask", BOOLEAN_MESSAGE, BOOLEAN_MESSAGE);
        } else {
            this.emit(":ask", REPROMPT_MESSAGE, REPROMPT_MESSAGE);
        }

        response += getAnswer(answer, answerMapping);

    	if (this.attributes["counter"] < urlProperties.numberOfQuestions) {
            response += getCurrentScore(this.attributes["quizscore"], this.attributes["counter"]);
            this.attributes["response"] = response;
            this.emitWithState("AskQuestion");
        }
        else {
            response += getFinalScore(this.attributes["quizscore"], this.attributes["counter"]);
            this.attributes["response"] = response;
            this.attributes["hasStarted"] = hasStarted.STOP;
            this.emit(":ask", this.attributes["response"] + " " + PLAY_QUIZ_AGAIN, PLAY_QUIZ_AGAIN);
        } 
    },
    "AMAZON.RepeatIntent": function() {
        if (this.attributes["hasStarted"] == hasStarted.START) {
            this.emit(":ask", this.attributes["repeatQuestion"], this.attributes["repeatQuestion"]);
        }

        if (this.attributes["hasStarted"] == hasStarted.STOP) {
            this.emit(":ask", REPEAT_ERROR_MESSAGE + " " + HELP_MESSAGE, HELP_MESSAGE);
        }

        var response = getCategoryPrompt(this.attributes["card"]);
        this.emit(":ask", response, response);
    },
    "AMAZON.StartOverIntent": function() {
        this.attributes["hasStarted"] = hasStarted.STOP;
        this.handler.state = states.START;
        this.emitWithState("Start");
    },
    "AMAZON.StopIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.CancelIntent": function() {
        this.emit(":tell", EXIT_SKILL_MESSAGE);
    },
    "AMAZON.HelpIntent": function() {
        this.emit(":ask", HELP_MESSAGE, HELP_MESSAGE);
    },
    "Unhandled": function() {
        this.emit(":ask", UNHANDLED_MESSAGE, UNHANDLED_MESSAGE);
    }
});

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers, startHandlers, quizHandlers);
    alexa.execute();
};
