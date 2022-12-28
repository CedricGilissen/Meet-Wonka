import Select from "components/Select";
import { useEffect } from "react";
import { useState } from "react";
import "styles/main.css";

import Slider from "./components/Slider";

const APIKEY = "";

type ConfigState = {
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
};

function App() {
    const [models, setModels] = useState<string[]>(["text-davinci-003"]);
    const [loggedIn, setLoggedIn] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [config, setConfig] = useState<ConfigState>({
        model: "text-davinci-003",
        temperature: 0.4,
        maxTokens: 256,
        topP: 1,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
    });

    const updateConfig = (key: keyof ConfigState, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));

        // @ts-ignore
        chrome.storage.sync.set({ [key]: value });
    };

    useEffect(() => {
        // Load all available models from GPT-3 API
        if (loaded) {
            fetch("https://api.openai.com/v1/models", {
                headers: {
                    Authorization: `Bearer ${APIKEY}`,
                },
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.error) {
                        setLoggedIn(false);
                        return;
                    }
                    const model_ids = res.data.map((a: any) => a.id);
                    const sorted = model_ids.sort();
                    setModels(sorted);
                    setLoggedIn(true);
                });
        }
    }, [loaded]);

    useEffect(() => {
        // Load config from chrome storage
        // @ts-ignore
        chrome.storage.sync.get(
            [
                "model",
                "temperature",
                "maxTokens",
                "topP",
                "frequencyPenalty",
                "presencePenalty",
            ],
            (res: ConfigState) => {
                setConfig({
                    model: res.model || "text-davinci-003",
                    temperature: res.temperature || 0.4,
                    maxTokens: res.maxTokens || 256,
                    topP: res.topP || 1,
                    frequencyPenalty: res.frequencyPenalty || 0.0,
                    presencePenalty: res.presencePenalty || 0.0,
                });
                setLoaded(true);
            }
        );
    }, []);

    return (
        <div id="main">
            <h1>Wonka's Options</h1>
            {loggedIn && (
                <>
                    <Select
                        text="Model"
                        onChange={(n) => updateConfig("model", n)}
                        value={config.model}
                        options={models}
                    />
                    <Slider
                        text="Temperature"
                        onChange={(n) => updateConfig("temperature", n)}
                        min={0}
                        max={1}
                        value={config.temperature}
                        step={0.01}
                    />
                    <Slider
                        text="Top P"
                        onChange={(n) => updateConfig("topP", n)}
                        min={0}
                        max={1}
                        value={config.topP}
                        step={0.01}
                    />
                    <Slider
                        text="Max tokens"
                        onChange={(n) => updateConfig("maxTokens", n)}
                        min={1}
                        max={4000}
                        value={config.maxTokens}
                    />
                    <Slider
                        text="Frequency penalty"
                        onChange={(n) => updateConfig("frequencyPenalty", n)}
                        min={0}
                        max={2}
                        value={config.frequencyPenalty}
                        step={0.01}
                    />
                    <Slider
                        text="Presence penalty"
                        onChange={(n) => updateConfig("presencePenalty", n)}
                        min={0}
                        max={2}
                        value={config.presencePenalty}
                        step={0.01}
                    />
                </>
            )}
        </div>
    );
}

export default App;
