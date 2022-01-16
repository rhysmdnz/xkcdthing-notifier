import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

const db = admin.firestore();

export const checkXKCD = functions.pubsub.schedule("every 5 minutes")
    .onRun(async () => {
      const response: any = await axios.get("https://xkcd.com/info.0.json");

      const topicName = "new_xkcd_comic";

      const payload : admin.messaging.Message={
        topic: topicName,
        notification: {
          title: "New XKCD Comic",
          body: response.data["title"],
        },
        android: {
          notification: {
            imageUrl: response.data["img"],
            channelId: "new_xkcd_comic",
          },
        },
      };

      const docRef = db.collection("xkcd").doc("comics");
      const doc = await docRef.get();

      if (response.data["num"] > doc.get("latest") ||
      doc.get("latest") == undefined) {
        functions.logger.info("New XKCD Comic!", response.data);

        await docRef.set({
          latest: response.data["num"],
        });

        try {
          await admin.messaging().send(payload);
        } catch (err) {
          functions.logger.error("notification error", err);
        }
        functions.logger.info("notification sent");
      }
    });
