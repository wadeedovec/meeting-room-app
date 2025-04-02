import express from 'express';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';
import roomRoutes from "./routes/room.route.js";
import userRoutes from "./routes/users.route.js";
import reservationRoutes from "./routes/reservation.route.js";
import cors from 'cors';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.get('/api/token', (req, res) => {
    const tToken = req.query.token;
    if (!tToken) {
        res.status(500).send("No Token");
        return;
    } else {
        console.log('\x1b[33m%s\x1b[0m', "Easy peasy Token from Teams...");
        console.log("-----------------------------------------");
        console.log(tToken);
        console.log("\x1b[32m", "-----------------------------------------");
    }
    var oboPromise = new Promise((resolve, reject) => {
        const url = "https://login.microsoftonline.com/"+process.env.TENANT_ID+"/oauth2/v2.0/token";
        const params = {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "client_id": process.env.CLIENT_ID,
            "client_secret": process.env.CLIENT_SECRET,
            "scope": "User.Read",
            "requested_token_use": "on_behalf_of",
            "assertion": tToken
        };
        fetch(url, {
            method: "POST",
            body: toQueryString(params),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(result => {
            if (result.status !== 200) {
                result.json().then(json => {
                    reject({ "error": json["error"] });
                });
            } else {

                result.json().then(json => {
                    resolve(json);
                });
            }
        });
    });

    oboPromise.then((result) => {
        console.log('\x1b[36m%s\x1b[0m', ' Oh my heavens, it is the access token! ');
        console.log("-----------------------------------------");
        console.log(result["access_token"]);
        console.log("\x1b[32m", "-----------------------------------------");

        //graph call using the access token
        fetch("https://graph.microsoft.com/v1.0/me/",
            {
                method: 'GET',
                headers: {
                    "accept": "application/json",
                    "authorization": "bearer " + result["access_token"]
                },
                mode: 'cors',
                cache: 'default'
            })
            .then(res => res.json())
            .then(json => {
                res.send(json);
            });

    }, (err) => {
        console.log(err); // Error: 
        res.send(err);
    });
});
function toQueryString(queryParams) {
    let encodedQueryParams = [];
    for (let key in queryParams) {
        encodedQueryParams.push(key + "=" + encodeURIComponent(queryParams[key]));
    }
    return encodedQueryParams.join("&");
}
app.get('/login', (req, res) => {
    const state = generateRandomString(16); // Shorter length for state
    const codeVerifier = generateRandomString(256); // Recommended length for PKCE Verifier
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const scope = 'openid email profile';
    const redirectUri = encodeURIComponent('http://localhost:5000/oauth/callback');
    const clientId = process.env.CLIENT_ID;
    const authorizationUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    // Optionally save the codeVerifier and state in your session or database associated with the user's session
    req.session.codeVerifier = codeVerifier; // Assuming session middleware is setup
    req.session.state = state;

    res.redirect(authorizationUrl);
});

app.get('/oauth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing' });
    }

    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.CLIENT_ID);
    params.append('code', code);
    params.append('redirect_uri', 'http://localhost:5000/oauth/callback');  // Make sure this matches your registered redirect URI
    params.append('client_secret', process.env.CLIENT_SECRET);  // Include only if your flow requires it

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const data = await response.json();

        if (response.ok) {
            res.json({ access_token: data.access_token });
        } else {
            res.status(response.status).json({ error: data.error_description || 'Failed to get access token' });
        }
    } catch (error) {
        console.error('Error in token exchange:', error);
        res.status(500).json({ error: 'Internal server error during token exchange' });
    }
});

app.post('/api/getAccessToken', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(403).json({ error: "Unauthorized access" });
    }

    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.CLIENT_ID);
    params.append("client_secret", process.env.CLIENT_SECRET);
    params.append("scope", "https://graph.microsoft.com/.default");

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
        const data = await response.json();

        if (response.ok) {
            res.json({ access_token: data.access_token });
        } else {
            res.status(response.status).json({ error: data.error_description || "Failed to get access token" });
        }
    } catch (error) {
        console.error("Error fetching token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reservations", reservationRoutes);
app.listen(PORT, () => {
    connectDB();
    console.log("Server is running");
});