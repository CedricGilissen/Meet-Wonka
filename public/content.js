// Define a global variable pointing to the active email div
var ACTIVE_EMAIL_DIV = null;

const handleWriteButtonClick = (e) => {
    // Extract the text from the email
    let { originalEmail, currentEmail } = extractText();
    const prompt = designPrompt(originalEmail, currentEmail, ACTIVE_EMAIL_DIV.parentNode.querySelector(".button-container"));

    ACTIVE_EMAIL_DIV.focus();
    // TODO Need to make a new animation for this
    setWriteButtonLoading(e.target);
    // This sends the prompt to the OpenAI
    chrome.runtime.sendMessage({ prompt })
}

// Takes the text from the gmail box
const extractText = () => {
    // first check if the email already holds a gmail_quote div
    var originalEmailElement = ACTIVE_EMAIL_DIV.parentNode.querySelector(".gmail_quote")
    if (originalEmailElement != null){
        // get the original email text (no nested solution for now)
        var originalEmailText = originalEmailElement.childNodes[1].innerText

        var currentEmailText = ""
        // get the current email text
        var currentEmailElements = ACTIVE_EMAIL_DIV.childNodes
        for (const node of currentEmailElements) {
            if (node.nodeName === "DIV" & !node.classList?.contains("gmail_quote")){
                currentEmailText += node.innerText
                currentEmailText += "\n"
            }
        }
        return {"originalEmail":originalEmailText, "currentEmail":currentEmailText}
    }

    // then check if there is a hidden reply behind the three dots
    var threeDotsElement = ACTIVE_EMAIL_DIV.querySelector(".uC")
    if (threeDotsElement != null){
        // TODO. For now, just treat as no reply
    }

    // Define a variable to hold the extracted text
    var currentEmail = ACTIVE_EMAIL_DIV.innerText;
    // Replace any consecutive whitespace characters with a single space
    currentEmail = currentEmail.replace(/(\s)+/g, "$1");
    // Remove leading and trailing whitespace
    currentEmail = currentEmail.trim();
    // Return the entire text as a single string
    return { "originalEmail": ' ', "currentEmail": currentEmail };
};

const designPrompt = (originalEmail, currentEmail, promptbox) => {
    const casualButton = promptbox.querySelector(".emoji-button[promptValue='casual']");
    const formalButton = promptbox.querySelector(".emoji-button[promptValue='formal']");
    const positiveButton = promptbox.querySelector(".emoji-button[promptValue='positive']");
    const negativeButton = promptbox.querySelector(".emoji-button[promptValue='negative']");
    const enthousiasticButton = promptbox.querySelector(".emoji-button[promptValue='enthousiastic']");
    const neutralButton = promptbox.querySelector(".emoji-button[promptValue='neutral']");
    const annoyedButton = promptbox.querySelector(".emoji-button[promptValue='annoyed']");

    let prompt = "Write a ";

    // casual or formal button
    if (casualButton.classList.contains("clicked")) {
     prompt += "casual, ";
    } else if (formalButton.classList.contains("clicked")) {
        prompt += "formal, ";
       }

    // distinguish between emotions
    if (enthousiasticButton.classList.contains("clicked")) {
     prompt += "enthousiastic ";
    } else if (neutralButton.classList.contains("clicked")) {
     prompt += "neutral ";
    } else if (annoyedButton.classList.contains("clicked")) {
     prompt += "annoyed ";
        }
    // positive or negative button
    if (positiveButton.classList.contains("clicked")) {
     prompt += "and positive ";
    } else if (negativeButton.classList.contains("clicked")) {
         prompt += " and negative ";
          }
    // distinguish between reply to and write new email
    if (originalEmail === "") {
     prompt += "email ";
    } else {
         prompt += " reply to " + originalEmail;
        }
  
    // Include current email if there is one
    if (currentEmail != "") {
     prompt += " the email should include " + currentEmail;
        }

    return prompt;
};
    /*
    REMARK: This is where you can design the prompt Cédric. 
    @params: 
    * originalEmail: string representing the email you're replying to. empty string ("") if the email is the first in the chain.
        REMARK: Currently only the "currentEmail" value will be populated, i have to find out how to retrieve the originalEmail
        if it is not shown in the draft, and distinguish between current & original email if it is
    * currentEmail: actual text representing the email you're currently writing (or maybe sometimes the prompt the user gives instead of actually writing the email?)
    * promptbox: Element object containing the stateful promptbox
    @returns: A string containing the prompt we will send to the API Endpoint!

    @Cédric: You can use the promptbox variable to retreive the current state of the emojis. 
    It's a good challenge for you on how to work with DOM Objects! Good luck :) :)
    */
    //return "Write an email for me:";
//}

// Insert text as HTML
const insertText = (text) => {
    // Remove all direct children div's from ACTIVE_EMAIL_DIV that don't have the class "gmail_quote"
    for (const child of ACTIVE_EMAIL_DIV.children) {
        if (child.nodeName === "DIV" && !child.classList.contains("gmail_quote")) {
            child.remove();
        }
    }

    // Split the text at newline characters
    const spl_text = text.split("\n");
    // Define a variable to hold the resulting HTML string
    var res = "";

    // Further formatting of the HTML
    for (const s of spl_text) {
        if (s === "") {
            // Add a white line if there is no text
            res += "<div><br></div>";
        } else {
            // Add the text if there is text
            res += "<div>" + s + "</div>";
        }
    }

    // convert the HTML string to a DOM object and insert it into the email
    const dom = new DOMParser().parseFromString(res, "text/html");
    console.log(dom.body.childNodes)
    ACTIVE_EMAIL_DIV.prepend(...dom.body.childNodes);
};

const createPromptBox = async () => {
    ACTIVE_EMAIL_DIV.closest(".et").querySelectorAll(".ajT")[0].click()

    fetch(chrome.runtime.getURL("promptbox.html")).then(res => res.text()).then(promptboxHTML => {
        var promptbox = new DOMParser().parseFromString(promptboxHTML, "text/html").body.childNodes[0]

        //add the promptbox
        ACTIVE_EMAIL_DIV.parentNode.prepend(promptbox)

        // Needs to be here to allow box to appear above all other elements
        ACTIVE_EMAIL_DIV.classList.remove("aO9")
    })
};

// Gets all Email Boxes
const getAllEditable = () => {
    return document.querySelectorAll("div[contenteditable=true]");
};

//changed this to button 9 to see if it works on my button
const setWriteButtonLoading = (writeButton) => {
    writeButton.innerHTML = "Loading";

    // Remove all classes
    writeButton.classList.remove("write-button-error");

    // add loading class to button
    writeButton.classList.add("write-button-loading");
};

const setWriteButtonError = () => {
    const button = document.getElementById("write-button");
    button.innerHTML = "Error";

    // Remove all classes
    button.classList.remove("write-button-loading");

    // Add error class to button
    button.classList.add("write-button-error");
};

const setWriteButtonLoaded = () => {
    const button = document.getElementById("write-button");

    // Remove all classes
    button.classList.remove("write-button-loading");
    button.classList.remove("write-button-error");

    button.innerHTML = "WRITE"
};

const handlePromptBoxClick = (e) => {

    if (e.target.classList.contains("emoji-button")) {
        e.target.classList.toggle('clicked');

        const casualButton = document.querySelector(".emoji-button[promptValue='casual']");
        const formalButton = document.querySelector(".emoji-button[promptValue='formal']");
        const positiveButton = document.querySelector(".emoji-button[promptValue='positive']");
        const negativeButton = document.querySelector(".emoji-button[promptValue='negative']");
        const enthousiasticButton = document.querySelector(".emoji-button[promptValue='enthousiastic']");
        const neutralButton = document.querySelector(".emoji-button[promptValue='neutral']");
        const annoyedButton = document.querySelector(".emoji-button[promptValue='annoyed']");

        if (e.target.getAttribute("promptValue") === "negative") {
            positiveButton.classList.remove("clicked");
          } else if (e.target.getAttribute("promptValue") === "positive") {
            negativeButton.classList.remove("clicked");
          }

        if (e.target.getAttribute("promptValue") === "casual") {
            formalButton.classList.remove("clicked");
          } else if (e.target.getAttribute("promptValue") === "formal") {
            casualButton.classList.remove("clicked");
          }

        if (e.target.getAttribute("promptValue") === "enthousiastic") {
            neutralButton.classList.remove("clicked");
            annoyedButton.classList.remove("clicked");
          } else if (e.target.getAttribute("promptValue") === "neutral") {
            enthousiasticButton.classList.remove("clicked");
            annoyedButton.classList.remove("clicked");
          } else if (e.target.getAttribute("promptValue") === "annoyed") {
            enthousiasticButton.classList.remove("clicked");
            neutralButton.classList.remove("clicked");
        }
        return; 

    }

    if (e.target.classList.contains("write-button")) {
        handleWriteButtonClick(e)
    }
}

const handleClick = (e) => {
    const editableDivs = getAllEditable();
    for (const div of editableDivs) {
        if (div.parentElement.contains(e.target)) {
            // change to active Email Box
            ACTIVE_EMAIL_DIV = div;

            // If target is inside a promptbox, handle the promptbox click
            if (e.target.closest('#promptbox') != null) {
                handlePromptBoxClick(e)
                return;
            }

            // If element is in editable parent without promptbox, create a new promptbox
            if (div.parentNode.querySelector('#promptbox') == null) {
                createPromptBox();
                return;
            }
        }
    }
};

// Add event listeners
document.body.addEventListener("click", handleClick);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.generate) {
        if (request.generate.error) {
            setWriteButtonError();
            console.error(request.generate.error.message);
            insertText(request.generate.error.message);
        } else if (request.generate.text) {
            setWriteButtonLoaded();
            console.log(request.generate.text);
            insertText(request.generate.text);
        }
    }
});
