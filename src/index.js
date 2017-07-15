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
const categories = [
					{CatName: "video games",  CatID: 15},
					{CatName: "books",        CatID: 10},
					{CatName: "films",        CatID: 11},
                    {CatName: "history",      CatID: 23},
                    {CatName: "comics",       CatID: 29},
                    {CatName: "anime",        CatID: 31},
                    {CatName: "cartoons",     CatID: 32},
                    {CatName: "television",   CatID: 14},
                    {CatName: "mythology",    CatID: 20}
				   ];

/**
 * Holds url properties used to create Open Trivia DB Request in urlBuilder()
 * @param {int}    catID             ID the API uses to define a particular category. Set to
 *                                   "random" during RandomTriviaIntent in order to choose a random category from list.
 * @param {string} difficulty        Difficulty of question. To be implemented in later versions.
 * @param {string} type              Open Trivia DB supports true/false and multiple choice.
 *		                             Can be set to boolean, multiple, or any.
 * @param {int}    numberOfQuestions Number of questions to ask on the quiz.
 */
var urlProperties = {
						catID: null, difficulty: null, type: "any", numberOfQuestions: 6
					};


//List of speechcons to use when a user answers question correctly.
var speechConsCorrect = ["Booya", "All righty", "Bam", "Bazinga", "Bingo", "Boom", "Bravo", "Cha Ching", "Cheers", "Dynomite", 
"Hip hip hooray", "Hurrah", "Hurray", "Huzzah", "Oh dear.  Just kidding.  Hurray", "Kaboom", "Kaching", "Oh snap", "Phew", 
"Righto", "Way to go", "Well done", "Whee", "Woo hoo", "Yay", "Wowza", "Yowsa", "Yay"];

//List of speechcons to use when a user answers question incorrectly.
var speechConsWrong = ["Argh", "Aw man", "Blarg", "Blast", "Boo", "Bummer", "Darn", "D'oh", "Dun dun dun", "Eek", "Honk", "Le sigh",
"Mamma mia", "Oh boy", "Oh dear", "Oof", "Ouch", "Ruh roh", "Shucks", "Uh oh", "Wah wah", "Whoops a daisy", "Yikes"];

//This is the welcome message for when a user starts the skill without a specific intent.
var WELCOME_MESSAGE = "Welcome to Nerd Trivia! You can start a quiz or ask for a random trivia question.  What would you like to do?";  

//This is the message a user will hear when they start random trivia.
var START_RANDOM_TRIVIA_MESSAGE = "OK. Here is a random trivia question. For true or false questions reply with true or false. For multiple choice questions, reply with the letter.";

//This is the message a user will hear when they start a quiz.
var START_QUIZ_MESSAGE = "OK. For true or false questions reply with true or false. For multiple choice questions, reply with the letter. I will ask you " + urlProperties.numberOfQuestions + " questions about";

//This is the message a user will hear when they try to cancel or stop the skill, or when they finish a quiz.
var EXIT_SKILL_MESSAGE = "Thank you for playing Nerd Trivia! Hope to see you again soon!";


//This is the message a user will hear after getting a question.
var REPROMPT_MESSAGE = "I´m waiting for your answer. If you need help please ask!";

//This is the message a user will hear when they ask Alexa for help.
var HELP_MESSAGE = "I´m a trivia app. You can ask me for a random trivia question and I´ll find an interesting trivia question for you! You can also play a game by asking me to start a quiz and I´ll quiz you to test your knowledge. What would you like to do?";

//This is the message a user will hear if there's a database error.
var DB_ERROR_MESSAGE = "There was a problem retrieving questions from database. Please try again.";

//Builds url for random trivia or quiz.
function urlBuilder() 
{
    var url = null;

    if(urlProperties.catID == "random") {
        var min = 0;
        var max = categories.length;
        var randomIndex = getRandom(min, max);

        if(urlProperties.type == "any") {
            url = "https://opentdb.com/api.php?amount=1&category=" + categories[randomIndex].CatID + "&encode=url3986";
        }else {
            url = "https://opentdb.com/api.php?amount=1&category=" + categories[randomIndex].CatID + "&type=" + urlProperties.type + "&encode=url3986";
        }
    }else if(urlProperties.type == "any") {
        url = "https://opentdb.com/api.php?amount=" + urlProperties.numberOfQuestions + "&category=" + urlProperties.catID + "&encode=url3986";
    }else {
        url = "https://opentdb.com/api.php?amount=" + urlProperties.numberOfQuestions + "&category=" + urlProperties.catID + "&type=" + urlProperties.type + "&encode=url3986";
    }

    return url;
}

//Gets random int inclusive-exclusive.
function getRandom(min, max) { return Math.floor(Math.random() * (max - min)) + min; }

//Gets question from data retrieved from Open Trivia DB.
function getQuestion(counter, questionStruct, answerMapping) 
{ 
    //for random trivia, since we're only asking one question
    if(counter == -1) {
        if(questionStruct.type.toLowerCase() == "boolean") {
            answerMapping.asnwer = questionStruct.correct_answer;
            return questionStruct.question + " True or False?";
        }
        return getMultipleChoices(questionStruct, answerMapping);  
    }

    if(questionStruct.type.toLowerCase() == "boolean") {
        answerMapping.answer = questionStruct.correct_answer;
        return "Here is your " + counter + "th question. " + questionStruct.question + " " + "True or False?";
    }

    return "Here is your " + counter + "th question. " + getMultipleChoices(questionStruct, answerMapping); 
}

//Gets choices for multiple choice questions.
function getMultipleChoices(questionStruct, answerMapping) 
{
    var multipleArray = questionStruct.incorrect_answers;
    multipleArray.push(questionStruct.correct_answer);
    multipleArray = shuffleArray(multipleArray);

    var alphaArray = [
                        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
                        "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
                     ];

    var result = "";
    for(var i = 0; i < multipleArray.length; i++) {
        if(multipleArray[i] == questionStruct.correct_answer) {
            answerMapping.answer = alphaArray[i];
        }

        if(i == (multipleArray.length - 1)) {
            result += "or " + alphaArray[i] + ". " + multipleArray[i] + ".";
        } else {
            result += alphaArray[i] + ". " + multipleArray[i] + ". ";
        }
    }

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
    if(answer == "True" || answer == "False") {
        return "The answer is " + answer + ". "; 
    }
    return "The answer is " + answerMapping.answer + ". " + answer + ". "; 
}

//Gets the current score during a quiz.
function getCurrentScore(score, counter) { return "Your current score is " + score + " out of " + (counter * 10) + ". "; }

//Gets the final score after a quiz finishes.
function getFinalScore(score, counter) { return "Your final score is " + score + " out of " + (counter * 10) + ". "; }

//Returns speechcons to use for answer reponses.
function getSpeechCon(type)
{
    var speechCon = "";
    if (type) return "<say-as interpret-as='interjection'>" + speechConsCorrect[getRandom(0, speechConsCorrect.length)] + "! </say-as><break strength='strong'/>";
    else return "<say-as interpret-as='interjection'>" + speechConsWrong[getRandom(0, speechConsWrong.length)] + ". </say-as><break strength='strong'/>";    
}

//Returns list of categories.
function getCategoryPrompt()
{
	var speech = "Please choose a category. Here is the list you can choose from.";
	for(var i = 0; i < categories.length; i++) {
		if(i == (categories.length - 1)) {
			speech += " and " + categories[i].CatName + ".";
		} else {
			speech += " " + categories[i].CatName + ".";
		}
	}
	return speech;
}

//Makes sure category picked by user is valid
function getCategory(userPick)
{
	if(userPick.value != undefined) {
		return true;
	}
	
	return false;
}

//Compare answer given by user and correct answer.
function compareAnswers(slots, value)
{   
    for (var slot in slots) {
        if (slots[slot].value != undefined) {
            if (slots[slot].value.toString().toLowerCase() == value.toString().toLowerCase()) {
                return true;
            }
        }
    }
    return false;
}

//Format Open Trivia DB data
function format(value)
{
    var result = decodeURIComponent(value);

    if(result.includes("-")) {
        result = result.replace(/-/g, " ");
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
        this.handler.state = states.Quiz;
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
        this.emitWithState("StartRandomTrivia");
    },
    "StartRandomTrivia": function() {
        urlProperties.catID = "random";
        var body = "";
        var data = "";

        const url = urlBuilder();


        var req = https.request(url, (res) => {

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', () => {
                data = JSON.parse(body);
                var results = data.results;
                for(var i = 0; i < results.length; i++) {
                    results[i].question = format(results[i].question);
                    results[i].correct_answer = format(results[i].correct_answer);
                    for(var j = 0; j < results[i].incorrect_answers.length; j++) {
                        results[i].incorrect_answers[j] = format(results[i].incorrect_answers[j]);
                    }
                }
                this.attributes["questionList"] = results;
                this.emitWithState("AskQuestion");
            });


        });

        req.on('error', (e) => {
            console.error(e);
            this.emit(":tell", DB_ERROR_MESSAGE, DB_ERROR_MESSAGE);
            
        });

        req.end();

    },
    "AskQuestion": function() {
        var speechOutput = START_RANDOM_TRIVIA_MESSAGE + " ";
        this.attributes["currentQuestion"] = this.attributes["questionList"][0]; 
        this.attributes["answerMapping"] = {answer: null};

        var result = "";
        result = getQuestion(-1, this.attributes["currentQuestion"], this.attributes["answerMapping"]);

        speechOutput += result;

        this.emit(":ask", speechOutput, REPROMPT_MESSAGE);
    },
    "AnswerIntent": function() {
        if(this.attributes["currentQuestion"] == undefined) {
            var response = "I don't know too much about that.";
            this.emit(":ask", response + " " + HELP_MESSAGE, HELP_MESSAGE);
        }
        var response = "";
        var answer = this.attributes["currentQuestion"].correct_answer;
        var answerMapping = this.attributes["answerMapping"];
        var userPick = this.event.request.intent.slots;
        
        var userAnswer = compareAnswers(userPick, answerMapping.answer);

        if (userAnswer) {
            response = getSpeechCon(true);
            response += "That's correct!";
        }
        else {
            response = getSpeechCon(false);
            response += "That's incorrect!";
        }

        response += getAnswer(answer, answerMapping);
        this.emit(":tell", response + " " + EXIT_SKILL_MESSAGE);
    },
    "QuizIntent": function() {
        this.handler.state = states.QUIZ;
        this.emitWithState("Quiz");
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
        this.emitWithState("Start");
    }
});

var quizHandlers = Alexa.CreateStateHandler(states.QUIZ,{
    "Quiz": function() {
        this.attributes["response"] = "";
        this.attributes["counter"] = 0;
        this.attributes["quizscore"] = 0;
        this.attributes["category"] = "";
        this.emit(":ask", getCategoryPrompt(), getCategoryPrompt());
    },
    "CategoryIntent": function() {
       var userPick = this.event.request.intent.slots.Category;
      
        if(!getCategory(userPick)) {
           this.emitWithState("Quiz");
        } else {
            this.attributes["category"] = userPick.value.toString().toLowerCase();
            this.emitWithState("GetQuestions");
        }
    },
    "GetQuestions": function() {
       for(var i = 0; i < categories.length; i++) {
            if(categories[i].CatName.toString().toLowerCase() == this.attributes["category"]){
                urlProperties.catID = categories[i].CatID;
            }
       }    

        var body = "";
        var data = "";

        const url = urlBuilder();
       
        var req = https.request(url, (res) => {

            res.on('data', (d) => {
                body += d;
            });

            res.on('end', () => {
                data = JSON.parse(body);
                var results = data.results;
                for(var i = 0; i < results.length; i++) {
                    results[i].question = format(results[i].question);
                    results[i].correct_answer = format(results[i].correct_answer);
                    for(var j = 0; j < results[i].incorrect_answers.length; j++) {
                        results[i].incorrect_answers[j] = format(results[i].incorrect_answers[j]);
                    }
                }
                this.attributes["questionList"] = results;
                this.emitWithState("AskQuestion");
            });


        });

        req.on('error', (e) => {
            console.error(e);
            this.emit(":tell", DB_ERROR_MESSAGE, DB_ERROR_MESSAGE);
            
        });

        req.end();

    },
    "AskQuestion": function() {
        var speechOutput = "";

        if (this.attributes["counter"] === 0) {
            this.attributes["response"] = START_QUIZ_MESSAGE + " " + this.attributes["category"] + ". ";
        } 

        this.attributes["currentQuestion"] = this.attributes["questionList"][this.attributes["counter"]];
        this.attributes["counter"]++;
        this.attributes["answerMapping"] = {answer: null};
        var result = getQuestion(this.attributes["counter"], this.attributes["currentQuestion"], this.attributes["answerMapping"]);
        speechOutput = this.attributes["response"] + result;

        this.emit(":ask", speechOutput, REPROMPT_MESSAGE);
    },
    "AnswerIntent": function() {
        if(this.attributes["category"] == ""){
            var response = "I don't know too much about that. If you want to take a quiz.";
            this.emit(":ask", response + " " + getCategoryPrompt(), getCategoryPrompt());
        }

    	var response = "";
        var answer = this.attributes["currentQuestion"].correct_answer;
        var answerMapping = this.attributes["answerMapping"];
        var userPick = this.event.request.intent.slots;
        
        var userAnswer = compareAnswers(userPick, answerMapping.answer);

        if (userAnswer) {
            response = getSpeechCon(true);
            response += "That's correct!";
            this.attributes["quizscore"] += 10;
        }
        else {
            response = getSpeechCon(false);
            response += "That's incorrect!";
        }

        response += getAnswer(answer, answerMapping);

    	if (this.attributes["counter"] < urlProperties.numberOfQuestions) {
            response += getCurrentScore(this.attributes["quizscore"], this.attributes["counter"]);
            this.attributes["response"] = response;
            this.emitWithState("AskQuestion");
        }
        else {
            response += getFinalScore(this.attributes["quizscore"], this.attributes["counter"]);
            this.emit(":tell", response + " " + EXIT_SKILL_MESSAGE);
        } 
    },
    "AMAZON.StartOverIntent": function() {
        this.emitWithState("Quiz");
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
        this.emitWithState("AnswerIntent");
    }
});

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers, startHandlers, quizHandlers);
    alexa.execute();
};
