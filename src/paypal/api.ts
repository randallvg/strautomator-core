// Strautomator Core: PayPal API

import {PayPalAuth, PayPalBillingPlan, PayPalProduct} from "./types"
import {axiosRequest} from "../axios"
import database from "../database"
import _ from "lodash"
import logger from "anyhow"
import dayjs from "../dayjs"
const settings = require("setmeup").settings

// Helper function to get error details from PayPal responses.
const parseResponseError = (err) => {
    if (!err.response || !err.response.data) return err

    const details = []
    const data = err.response.data

    if (err.response.status) {
        details.push(`Status ${err.response.status}`)
    }

    if (data.name && data.name.toString) {
        details.push(data.name.toString())
    } else if (data.message && data.message.toString) {
        details.push(data.message.toString())
    }

    if (data.details && data.details.length > 0) {
        for (let d of data.details) {
            const issue = `${d.issue} ${d.description}`.trim()
            details.push(issue)
        }
    }

    if (details.length == 0) {
        details.push(JSON.stringify(err, null, 0))
    }

    return details.join(", ")
}

/**
 * PayPal API handler.
 */
export class PayPalAPI {
    private constructor() {}
    private static _instance: PayPalAPI
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Authentication token and expiry timestamp for the api.
     */
    auth: PayPalAuth

    /**
     * Authentication token and expiry timestamp for the m-api.
     */
    mAuth: PayPalAuth

    /**
     * The current product registered on PayPal.
     */
    currentProduct: PayPalProduct

    /**
     * Active billing plans on PayPal.
     */
    currentBillingPlans: {[id: string]: PayPalBillingPlan} = {}

    /**
     * URL used for webhooks.
     */
    get webhookUrl(): string {
        const baseUrl = settings.api.url || `${settings.app.url}api/`
        const token = settings.paypal.api.urlToken
        return `${baseUrl}paypal/webhook/${token}`
    }

    // METHODS
    // --------------------------------------------------------------------------

    /**
     * Authenticate on PayPal and get a new access token.
     * @param mEndpoint Get token for the api-m endpoint?
     */
    authenticate = async (mEndpoint?: boolean): Promise<boolean> => {
        const endpointLog = mEndpoint ? "api-m" : "api"

        try {
            const options = {
                method: "POST",
                url: `${mEndpoint ? settings.paypal.api.mBaseUrl : settings.paypal.api.baseUrl}v1/oauth2/token`,
                timeout: settings.oauth.tokenTimeout,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                auth: {
                    username: settings.paypal.api.clientId,
                    password: settings.paypal.api.clientSecret
                },
                data: new URLSearchParams({grant_type: "client_credentials"})
            }

            // Try fetching a new token from PayPal.
            const res = await axiosRequest(options)
            const expiresIn = res.expires_in ? res.expires_in : 3600
            const tokenData = {
                accessToken: res.access_token,
                expiresAt: expiresIn + dayjs().unix() - 180
            }

            logger.info("PayPal.authenticate", `Got a new ${endpointLog} token`)

            // Set auth token and expiry timestamp.
            if (mEndpoint) {
                this.mAuth = tokenData
                await database.appState.set("paypal", {mAuth: tokenData})
            } else {
                this.auth = tokenData
                await database.appState.set("paypal", {auth: tokenData})
            }

            return true
        } catch (ex) {
            logger.error("PayPal.authenticate", endpointLog, parseResponseError(ex))
            return false
        }
    }

    /**
     * Make a request to the PayPal API with the given options.
     * @param options Options passed to the request (axios).
     * @param mEndpoint Use the api-m endpoint?
     */
    makeRequest = async (reqOptions: any, mEndpoint?: boolean): Promise<any> => {
        const options = _.cloneDeep(reqOptions)
        const auth = mEndpoint ? this.mAuth : this.auth

        try {
            if (!auth) {
                try {
                    await this.authenticate(mEndpoint)
                } catch (innerEx) {
                    throw new Error("Not authenticated to PayPal")
                }
            } else if (auth.expiresAt <= dayjs().unix()) {
                logger.info("PayPal.makeRequest", reqOptions.url, "Token expired, will fetch a new one")
                await this.authenticate(mEndpoint)
            }

            // Make sure headers object is set.
            if (!options.headers) options.headers = {}
            options.headers["Authorization"] = `Bearer ${mEndpoint ? this.mAuth.accessToken : this.auth.accessToken}`

            // Set correct full URL.
            if (options.url.substring(0, 4) != "http") {
                options.url = `${mEndpoint ? settings.paypal.api.mBaseUrl : settings.paypal.api.baseUrl}${options.url}`
            }

            // Return full representation?
            if (options.returnRepresentation) {
                delete options.returnRepresentation
                options.headers["Prefer"] = "return=representation"
            }

            // Dispatch request to PayPal.
            const res = await axiosRequest(options)
            return res
        } catch (ex) {
            const err = parseResponseError(ex)
            logger.error("PayPal.makeRequest", reqOptions.method, reqOptions.url, err)
            ex.message = err
            throw ex
        }
    }
}

// Exports...
export default PayPalAPI.Instance
