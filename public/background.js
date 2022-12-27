const getConfig = async () => {
    const {
        apiKey,
        model,
        temperature,
        maxTokens,
        topP,
        frequencyPenalty,
        presencePenalty,
    } = await chrome.storage.sync.get([
        "apiKey",
        "model",
        "temperature",
        "maxTokens",
        "topP",
        "frequencyPenalty",
        "presencePenalty",
    ]);

    return {
        apiKey: apiKey || "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",
        model: model || "text-davinci-003",
        temperature: temperature || 0.4,
        maxTokens: maxTokens || 856,
        topP: topP || 1,
        frequencyPenalty: frequencyPenalty || 0,
        presencePenalty: presencePenalty || 0,
    };
};

const getNextTokens = async (prompt, suffix, parameters) => {
    console.log(prompt,suffix)

    if (prompt.startsWith("testMail")){
        return {text: `Hoi,
        Waar ben je momenteel zoal mee bezig?
        Vriendelijke groeten,
        Wim`}
    }

    const url = "https://api.openai.com/v1/completions";
    const data = {
        prompt: prompt,
        suffix: suffix || null,
        model: parameters.model,
        max_tokens: parameters.maxTokens,
        temperature: parameters.temperature,
        top_p: parameters.topP,
        frequency_penalty: parameters.frequencyPenalty,
        presence_penalty: parameters.presencePenalty,
    };
    const headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + parameters.apiKey,
    };

    // Make request
    const res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
    });

    const json = await res.json();
    console.log(json)

    if (json.error) {
        return { error: json.error };
    }

    return { text: json.choices[0].text };
};

const logAPICall = async (prompt, completedText, parameters) => {
    const url = "https://meet-wonka-api.azurewebsites.net/api/logRequest"
    const data = {
        prompt: prompt,
        response: completedText.text,
        parameters: parameters
    }
    const headers = {
        "Content-Type": "application/json"
    }

    // Make request
    const res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
    });

    if (res.status===200) {
        console.log("Logged the following API call to the DB:")
        console.log(data)
    } else {
        console.log("Error logging API call to the DB. Status Code" + res.status)
    }
}

chrome.runtime.onMessage.addListener(async (request) => {
    console.log(request)
    if (request.prompt != null) {
        // Communicate with content script to get the current text
        // I think this is where we can add the variables from the buttons
        const prompt = request.prompt;
        const suffix = "";

        const parameters = await getConfig();

        const completedText = await getNextTokens(prompt, suffix, parameters);

        // Communicate with content script to update the text
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { generate: completedText });
        });

        logAPICall(request.privacy? "" : prompt, request.privacy? "" : completedText, parameters);
    }
});