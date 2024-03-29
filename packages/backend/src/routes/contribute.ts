import { Prisma, PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import { hashMessage, recoverTypedDataAddress } from "viem";

const router = express.Router();
const prisma = new PrismaClient();

type ReqBody = {
  urls: string[];
  signature: `0x${string}`;
  address: string;
};

type ResultUrl = {
  url: string;
  success: boolean;
  error?: string;
};

const EIP_712_DOMAIN = {
  name: "Collective DAO Catalog",
  version: "1",
  chainId: 10,
} as const;

const EIP_712_TYPES = {
  Message: [{ name: "urlHash", type: "string" }],
} as const;

router.post("/", async (req: Request, res: Response) => {
  const { urls, signature, address }: ReqBody = req.body;

  if (!urls) {
    return res.status(400).json({ error: "Missing required parameter: urls" });
  }

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: "Invalid parameter: urls" });
  }

  // Validate Signature
  const recoveredAddress = await recoverTypedDataAddress({
    domain: EIP_712_DOMAIN,
    types: EIP_712_TYPES,
    primaryType: "Message",
    message: { urlHash: hashMessage(JSON.stringify(urls)) },
    signature,
  });

  if (recoveredAddress !== address) {
    console.error("recoveredAddress error", recoveredAddress, String(address).replace(/\n|\r/g, ""));
    return res.status(401).json({ message: "Invalid signature" });
  }

  const result: ResultUrl[] = [];

  for (const url of urls) {
    try {
      new URL(url);

      const urlData = {
        url,
      } as {
        url: string;
      };

      await prisma.submission.create({
        data: {
          ...urlData,
          address,
        },
      });

      result.push({ url, success: true });
    } catch (err) {
      console.log(err);
      let error = "An error occurred while submiting link";
      if (err instanceof TypeError) {
        error = "Invalid url";
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          error = "Link already submitted";
        }
      }
      result.push({ url, success: false, error });
    }
  }

  return res.status(200).json({ result });
});

export default router;
