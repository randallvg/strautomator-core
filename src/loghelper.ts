// Strautomator Core: Log Helper

import {EventEntity} from "@paddle/paddle-node-sdk"
import {FitFileActivity} from "./fitparser/types"
import {GarminPingActivityFile} from "./garmin/types"
import {GearWearConfig} from "./gearwear/types"
import {GitHubSubscription} from "./github/types"
import {PaddleSubscription} from "./paddle/types"
import {PayPalSubscription} from "./paypal/types"
import {RecipeData} from "./recipes/types"
import {SpotifyTrack} from "./spotify/types"
import {StravaActivity, StravaGear, StravaProcessedActivity} from "./strava/types"
import {BaseSubscription} from "./subscriptions/types"
import {UserData} from "./users/types"
import {WahooWebhookData} from "./wahoo/types"
import _ from "lodash"
import dayjs from "./dayjs"

/**
 * Helper to get activity details for logging.
 * @param lActivity Activity data.
 * @param detailed Optional, if true will return extra details about the activity.
 */
export const activity = (lActivity: StravaActivity | StravaProcessedActivity, detailed?: boolean): string => {
    if (!lActivity) return "Activity unknown"
    if (!detailed) return `Activity ${lActivity.id}`
    const details = _.compact([lActivity.name, lActivity.sportType, dayjs(lActivity.dateStart).format("lll")])
    return `Activity ${lActivity.id} - ${details.join(", ")}`
}

/**
 * Helper to get FIT file activity details for logging.
 * @param lActivity FIT file activity data.
 * @param detailed Optional, if true will return extra details about the activity.
 */
export const fitFileActivity = (lActivity: FitFileActivity, detailed?: boolean): string => {
    if (!lActivity) return "Activity unknown"
    if (!detailed) return `FIT ${lActivity.id}`
    const details = _.compact([lActivity.name, lActivity.sportProfile, lActivity.workoutName, dayjs(lActivity.dateStart).format("lll")])
    if (lActivity.devices?.length > 0) {
        details.push(`${lActivity.devices.length} devices`)
    }
    return `FIT ${lActivity.id} - ${details.join(", ")}`
}

/**
 * Helper to get Garmin ping details for logging.
 * @param lPing FIT file activity data.
 */
export const garminPing = (lPing: GarminPingActivityFile): string => {
    if (!lPing) return "Ping unknown"
    const id = lPing.activityId.toString().replace("activity", "")
    const name = lPing.activityName
    return `Garmin activity ${id} - ${name}`
}

/**
 * Helper to get GearWear config details.
 * @param lUser Owner of the config.
 * @param lConfig The GearWear config.
 */
export const gearwearConfig = (lUser: UserData, lConfig: GearWearConfig): string => {
    const bike = _.find(lUser.profile.bikes, {id: lConfig.id})
    const shoe = _.find(lUser.profile.shoes, {id: lConfig.id})
    const gear: StravaGear = bike || shoe
    return gear ? `GearWear ${lConfig.id} - ${gear.name}` : `Invalid GearWear ${lConfig.id} (not found)}`
}

/**
 * Helper to get the Paddle webhook event details for logging.
 * @param lEvent Paddle webhook event.
 */
export const paddleEvent = (lEvent: EventEntity): string => {
    if (!paddleEvent) return "Activity unknown"
    return `${lEvent.eventType}: ${lEvent.eventId} - ${lEvent.data.id}`
}

/**
 * Helper to get automation recipe details for logging.
 * @param lRecipe Recipe data.
 * @param fullDetails Optional, if true will return details about the activity.
 */
export const recipe = (lRecipe: RecipeData): string => {
    if (!lRecipe) return "recipe unknown"
    const conditonsLog = lRecipe.defaultFor ? `D${lRecipe.defaultFor.length}` : `C${lRecipe.conditions.length}`
    const actionsLog = `A${lRecipe.actions.length}`
    if (lRecipe.id && lRecipe.title) return `Recipe ${lRecipe.id}: ${lRecipe.title} (${conditonsLog} ${actionsLog})`
    return lRecipe.id
}

/**
 * Helper to get Spotify track details for logging.
 * @param lSpotifyTrack Spotify track data.
 */
export const spotifyTrack = (lSpotifyTrack: SpotifyTrack): string => {
    if (!lSpotifyTrack) return "Unknown spotify track"
    return `Spotify: ${lSpotifyTrack.title}`
}

/**
 * Helper to get subscription details for logging.
 * @param lSubscription Subscription data.
 */
export const subscription = (lSubscription: BaseSubscription | GitHubSubscription | PaddleSubscription | PayPalSubscription): string => {
    if (!lSubscription) return "Subscription unknown"
    return `Subscription ${lSubscription.source} ${lSubscription.id} - ${lSubscription.status}`
}

/**
 * Helper to get subscription and user summary for logging.
 * @param lSubscription Subscription data.
 */
export const subscriptionUser = (lSubscription: BaseSubscription | GitHubSubscription | PaddleSubscription | PayPalSubscription): string => {
    if (!lSubscription) return "Subscription unknown"
    return `User ${lSubscription.userId} - Subscription ${lSubscription.source} ${lSubscription.id} (${lSubscription.status})`
}

/**
 * Helper to get user details for logging.
 * @param lUser User data.
 */
export const user = (lUser: UserData | Partial<UserData>): string => {
    if (!lUser) return "User unknown"
    if (lUser.id && lUser.displayName) return `User ${lUser.id} ${lUser.displayName}`
    return lUser.id || lUser.displayName
}

/**
 * Helper to get Wahoo webhook details for logging.
 * @param lData User data.
 */
export const wahooWebhook = (lData: WahooWebhookData): string => {
    if (!lData) return "User unknown"
    const user = `Wahoo user ${lData.user?.id || "unknown"}`
    const workout = `Workout ${lData.workout_summary?.id || "unknown"}`
    return `${lData.event_type}: ${user} - ${workout}`
}
