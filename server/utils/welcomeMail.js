// utils/welcomeMail.js
const sendEmail = require("../config/forgotMail");
const path = require("path");

/**
 * Sends a formatted welcome email to the user after successful signup.
 * 
 * @param {string} email - User's email address
 */
const sendWelcomeMail = async (email) => {
  const subject = "Welcome to Youtax 👋";

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en" style="margin: 0; padding: 0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Welcome Email</title>

    <style>
      body {
        margin: 0;
        padding: 0;
        background: #f4f6f9;
        font-family: Arial, sans-serif;
      }
      table {
        border-spacing: 0;
        width: 100%;
      }
      img {
        max-width: 100%;
        border: none;
      }
      a {
        text-decoration: none;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #1a1a1a !important;
        }
        .container {
          background: #222 !important;
          color: #f1f1f1 !important;
        }
        .title {
          color: #fff !important;
        }
        .text-muted {
          color: #ccc !important;
        }
        .button {
          background: rgb(0, 102, 204) !important;
        }
      }

      @media only screen and (max-width: 600px) {
        .container {
          width: 90% !important;
          padding: 20px !important;
        }
        .button {
          width: 100% !important;
          text-align: center !important;
          padding: 14px !important;
        }
      }

    </style>
  </head>

  <body>
    <table role="presentation">
      <tr>
        <td align="center" style="padding: 20px;">
          
          <!-- MAIN CONTAINER -->
          <table class="container" role="presentation" width="600"
            style="
              background: #ffffff;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            ">

            <!-- LOGO -->
            <tr>
              <td align="center" style="padding-bottom: 10px;">
                <img src="cid:ytlogo" alt="Youtax Logo" width="180" />
              </td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td align="center">
                <h2 class="title" style="
                    margin: 0;
                    color: rgb(0, 51, 102);
                    font-size: 24px;
                    font-weight: 700;">
                  Welcome to Youtax 👋
                </h2>
              </td>
            </tr>

            <tr><td style="height: 20px;"></td></tr>

            <!-- MESSAGE BODY -->
            <tr>
              <td style="font-size: 15px; line-height: 1.6; color: #333;">
                Thank you for registering with us.<br/>
                Your account has been successfully created, and you’re all set to get started.
                <br/><br/>
                You can now log in to your dashboard and begin exploring our services.
              </td>
            </tr>

            <tr><td style="height: 25px;"></td></tr>

            <!-- BUTTON -->
            <tr>
              <td align="center">
                <a href="https://cms.youtax.in/user/login"
                  class="button"
                  style="
                    background: rgb(0, 51, 102);
                    color: #ffffff;
                    padding: 12px 30px;
                    font-size: 15px;
                    font-weight: bold;
                    border-radius: 6px;
                    display: inline-block;">
                  Login Now
                </a>
              </td>
            </tr>

            <tr><td style="height: 25px;"></td></tr>

            <!-- FOOTER -->
            <tr>
              <td style="font-size: 15px; line-height: 1.6; color: #333;">
                If you need any assistance, our support team is always here to help.
                <br/><br/>
                Warm regards,<br/>
                <strong>Team Youtax</strong>
              </td>
            </tr>

            <tr><td style="height: 15px;"></td></tr>

            <tr>
              <td class="text-muted"
                style="font-size: 12px; color: #777; line-height: 1.5;">
                If you did not create this account, please ignore this email.
              </td>
            </tr>

          </table>
          <!-- END CONTAINER -->

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;

  try {
    await sendEmail(
      email,
      subject,
      htmlContent,
      [
        {
          filename: "logo.png",
          path: path.join(__dirname, "logo.png"),
          cid: "ytlogo"
        }
      ]
    );

    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.error("❌ Error sending welcome email:", err);
  }
};

module.exports = sendWelcomeMail;
