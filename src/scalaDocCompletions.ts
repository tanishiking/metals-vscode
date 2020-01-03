import {
  CompletionItem,
  CompletionItemProvider,
  TextDocument,
  Position,
  CancellationToken
} from "vscode";
import {
  LanguageClient,
  CompletionParams,
  CompletionRequest,
  CompletionItem as LSPCompletionItem,
  CompletionList as LSPCompletionList
} from "vscode-languageclient";

export class ScalaDocCompletionProvider implements CompletionItemProvider {
  constructor(private readonly client: LanguageClient) {}

  public async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<CompletionItem[] | undefined> {
    console.log(document);
    if (!this.isPotentiallyValidDocCompletionPosition(document, position)) {
      return undefined;
    }
    console.log("potentially valid");
    const args = this.toCompletionParams(document, position);
    const response:
      | LSPCompletionList
      | LSPCompletionItem[]
      | null = await this.client.sendRequest(
      CompletionRequest.type,
      args,
      token
    );
    return this.toCompletionItems(response);
  }

  private toCompletionParams(
    document: TextDocument,
    position: Position
  ): CompletionParams {
    return {
      textDocument: {
        uri: document.uri.toString()
      },
      position
    };
  }

  private toCompletionItems(
    lspResult: LSPCompletionList | LSPCompletionItem[] | null
  ): CompletionItem[] | undefined {
    if (lspResult === null) {
      return undefined;
    } else if (lspResult instanceof Array) {
      return (lspResult as LSPCompletionItem[]).map(item => {
        return this.client.protocol2CodeConverter.asCompletionItem(item);
      });
    } else {
      return (lspResult.items as LSPCompletionItem[]).map(item => {
        return this.client.protocol2CodeConverter.asCompletionItem(item);
      });
    }
  }

  // come from https://github.com/microsoft/vscode/blob/508f43166bd8551a26d3b53b2e04008d0b9c357c/extensions/typescript-language-features/src/features/jsDocCompletions.ts#L76-L92
  private isPotentiallyValidDocCompletionPosition(
    document: TextDocument,
    position: Position
  ): boolean {
    // Only show the Scaladoc completion when the everything before the cursor is whitespace
    // or could be the opening of a comment
    const line = document.lineAt(position.line).text;
    const prefix = line.slice(0, position.character);
    return prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/) !== null;
  }
}
