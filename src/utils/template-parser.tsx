import Handlebars from "handlebars";

export const convertToEjs = (content: string): string => {
  if (content.match(/^My name is \[([^\]]+)\]\.$/)) {
    return content.replace(
      /My name is \[([^\]]+)\]\./,
      "<p>The inviter name is <%= $1 %>.</p>"
    );
  }

  let ejsContent = content
    .replace(/\[#if\s+([^\]]+)\]/g, "<% if ($1) { %>")
    .replace(/\[#else\]/g, "<% } else { %>")
    .replace(/\[#endif\]/g, "<% } %>")
    .replace(/\[([^\]]+)\]/g, "<%= $1 %>");

  if (!ejsContent.startsWith("<div") && !ejsContent.startsWith("<p>")) {
    ejsContent = `<p>${ejsContent}</p>`;
  }

  return ejsContent;
};

export const convertToSquareBracketSyntax = (content: string): string => {
  let squareBracketContent = content
    .replace(/<% if \(([^)]+)\) { %>/g, "[#if $1]")
    .replace(/<% } else { %>/g, "[#else]")
    .replace(/<% } %>/g, "[#endif]")
    .replace(/<%= ([^%]+) %>/g, "[$1]");

  if (
    squareBracketContent.startsWith("<p>") &&
    squareBracketContent.endsWith("</p>")
  ) {
    squareBracketContent = squareBracketContent.slice(3, -4);
  }

  return squareBracketContent;
};

export const parseTemplate = (
  template: string,
  variables: Record<string, unknown>
): string => {
  try {
    const handlebarsTemplate = template
      .replace(/\[#if\s+([^\]]+)\]/g, "{{#if $1}}")
      .replace(/\[#else\]/g, "{{else}}")
      .replace(/\[#endif\]/g, "{{/if}}")
      .replace(/\[([^\]]+)\]/g, "{{$1}}");

    const wrappedTemplate = handlebarsTemplate.startsWith("<p>")
      ? handlebarsTemplate
      : `<p>${handlebarsTemplate}</p>`;

    const compiledTemplate = Handlebars.compile(wrappedTemplate);
    return compiledTemplate(variables);
  } catch (error: unknown) {
    console.error("Error parsing template:", error);
    return template;
  }
};

//Guide for Syntax in Rich Text Editor:
//1. Use square brackets for dynamic variables: [inviter_name]
//2. Use square brackets for conditional blocks: [#if inviter_name]...[#else]...[#endif]

//Example :
//[#if inviter_name][inviter_name] has invited you to join them on [app.name].[#else]You are invited to join [app.name][#endif]
// <p><% if (inviter_name) { %><%= inviter_name %> has invited you to join them on <%= app.name %>.<% } else { %>You are invited to join <%= app.name %><% } %></p>
