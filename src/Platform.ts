/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as ts from "typescript";
import * as vscode from "vscode";

// https://github.com/typescript-language-server/typescript-language-server/blob/184c60de3308621380469d6632bdff2e10f672fd/src/completion.ts#L271
export function asCompletionItemKind(
  kind: ts.ScriptElementKind
): vscode.CompletionItemKind {
  switch (kind) {
    case ts.ScriptElementKind.primitiveType:
    case ts.ScriptElementKind.keyword:
      return vscode.CompletionItemKind.Keyword;
    case ts.ScriptElementKind.constElement:
    case ts.ScriptElementKind.letElement:
    case ts.ScriptElementKind.variableElement:
    case ts.ScriptElementKind.localVariableElement:
    case ts.ScriptElementKind.alias:
    case ts.ScriptElementKind.parameterElement:
      return vscode.CompletionItemKind.Variable;
    case ts.ScriptElementKind.memberVariableElement:
    case ts.ScriptElementKind.memberGetAccessorElement:
    case ts.ScriptElementKind.memberSetAccessorElement:
      return vscode.CompletionItemKind.Field;
    case ts.ScriptElementKind.functionElement:
    case ts.ScriptElementKind.localFunctionElement:
      return vscode.CompletionItemKind.Function;
    case ts.ScriptElementKind.memberFunctionElement:
    case ts.ScriptElementKind.constructSignatureElement:
    case ts.ScriptElementKind.callSignatureElement:
    case ts.ScriptElementKind.indexSignatureElement:
      return vscode.CompletionItemKind.Method;
    case ts.ScriptElementKind.enumElement:
      return vscode.CompletionItemKind.Enum;
    case ts.ScriptElementKind.enumMemberElement:
      return vscode.CompletionItemKind.EnumMember;
    case ts.ScriptElementKind.moduleElement:
    case ts.ScriptElementKind.externalModuleName:
      return vscode.CompletionItemKind.Module;
    case ts.ScriptElementKind.classElement:
    case ts.ScriptElementKind.typeElement:
      return vscode.CompletionItemKind.Class;
    case ts.ScriptElementKind.interfaceElement:
      return vscode.CompletionItemKind.Interface;
    case ts.ScriptElementKind.warning:
      return vscode.CompletionItemKind.Text;
    case ts.ScriptElementKind.scriptElement:
      return vscode.CompletionItemKind.File;
    case ts.ScriptElementKind.directory:
      return vscode.CompletionItemKind.Folder;
    case ts.ScriptElementKind.string:
      return vscode.CompletionItemKind.Constant;
  }
  return vscode.CompletionItemKind.Property;
}
