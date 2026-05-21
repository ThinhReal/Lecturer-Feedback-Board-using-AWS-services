import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

const TABLE_NAME = "LecturerFeedback";

const clientConfig: any = {
  region: process.env.AWS_REGION || "ap-southeast-1",
};

// Chỉ chèn thông tin xác thực thủ công nếu thực sự có biến môi trường (Local)
// Trên EC2, khối if này sẽ bị bỏ qua, giúp SDK tự động kích hoạt lấy quyền từ IAM Role.
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const client = new DynamoDBClient(clientConfig);

const docClient = DynamoDBDocumentClient.from(client);

export type FeedbackItem = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  editedAt?: string;
};

export async function GET() {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );

    const items = (result.Items ?? []) as FeedbackItem[];
    items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      message?: string;
    };

    const name = body.name?.trim();
    const message = body.message?.trim();

    if (!name || !message) {
      return NextResponse.json(
        { error: "Both 'name' and 'message' are required." },
        { status: 400 }
      );
    }

    const item: FeedbackItem = {
      id: crypto.randomUUID(),
      name,
      message,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: item })
    );

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      message?: string;
    };

    const id = body.id?.trim();
    const name = body.name?.trim();
    const message = body.message?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' parameter." },
        { status: 400 }
      );
    }

    if (!name || !message) {
      return NextResponse.json(
        { error: "Both 'name' and 'message' are required." },
        { status: 400 }
      );
    }

    const editedAt = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression:
          "SET #name = :name, #message = :message, #editedAt = :editedAt",
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: {
          "#name": "name",
          "#message": "message",
          "#editedAt": "editedAt",
        },
        ExpressionAttributeValues: {
          ":name": name,
          ":message": message,
          ":editedAt": editedAt,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return NextResponse.json({ item: result.Attributes as FeedbackItem });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ConditionalCheckFailedException"
    ) {
      return NextResponse.json(
        { error: "Feedback not found." },
        { status: 404 }
      );
    }
    console.error("PUT /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = (await request.json().catch(() => null)) as
        | { id?: string }
        | null;
      id = body?.id ?? null;
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing 'id' parameter." },
        { status: 400 }
      );
    }

    await docClient.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { id } })
    );

    return NextResponse.json({ id });
  } catch (error) {
    console.error("DELETE /api/feedback error:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
