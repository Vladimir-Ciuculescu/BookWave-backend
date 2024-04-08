import { MailtrapClient } from "mailtrap";

interface Attachment {
  filename: string;
  content_id: string;
  disposition: string;
  content: Buffer;
  type: string;
}

export const sendEmail = async (to: string, from: string, subject: string, html: string, attachments: Attachment[]) => {
  // mailtrap.sendMail({
  //   to,
  //   subject,
  //   from,
  //   html: html,
  //   attachments: attachments,
  // });

  // const TOKEN = "33248debbde7bafa1fe327a2440f0107";

  const TOKEN = process.env.MAILTRAP_TOKEN;
  const ENDPOINT = "https://send.api.mailtrap.io/";

  //@ts-ignore
  const client = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });

  const sender = {
    email: from,
    name: subject,
  };

  const recipients = [
    {
      email: to,
    },
  ];

  try {
    const result = await client.send({
      from: sender,
      to: recipients,
      subject,
      text: "Congratulations for sending test email with Mailtrap!",
      category: "Integration Test",
      html: html,

      attachments,
    });

    console.log(result);
  } catch (error: any) {
    console.log(error);
  }
};
