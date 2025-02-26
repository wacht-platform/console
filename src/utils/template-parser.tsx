import Handlebars from 'handlebars';

export const convertToEjs = (content: string): string => {
  // Check if it's a simple variable replacement
  if (content.match(/^My name is \[([^\]]+)\]\.$/)) {
    return content.replace(/My name is \[([^\]]+)\]\./, '<p>The inviter name is <%= $1 %>.</p>');
  }

  // Handle conditional blocks with inline EJS
  let ejsContent = content
    .replace(/\[#if\s+([^\]]+)\]/g, '<% if ($1) { %>')
    .replace(/\[#else\]/g, '<% } else { %>')
    .replace(/\[#endif\]/g, '<% } %>')
    .replace(/\[([^\]]+)\]/g, '<%= $1 %>');

  // Wrap in paragraph tags if not already wrapped
  if (!ejsContent.startsWith('<p>')) {
    ejsContent = `<p>${ejsContent}</p>`;
  }

  return ejsContent;
};

export const parseTemplate = (template: string, variables: Record<string, any>): string => {
  try {
    // Convert square bracket syntax to Handlebars syntax for parsing
    const handlebarsTemplate = template
      .replace(/\[#if\s+([^\]]+)\]/g, '{{#if $1}}')
      .replace(/\[#else\]/g, '{{else}}')
      .replace(/\[#endif\]/g, '{{/if}}')
      .replace(/\[([^\]]+)\]/g, '{{$1}}');

    // Wrap in paragraph tags if not already wrapped
    const wrappedTemplate = handlebarsTemplate.startsWith('<p>') 
      ? handlebarsTemplate 
      : `<p>${handlebarsTemplate}</p>`;

    const compiledTemplate = Handlebars.compile(wrappedTemplate);
    return compiledTemplate(variables);
  } catch (error) {
    console.error('Error parsing template:', error);
    return template;
  }
};

//Guide for Syntax in Rich Text Editor:
//1. Use square brackets for dynamic variables: [inviter_name]
//2. Use square brackets for conditional blocks: [#if inviter_name]...[#else]...[#endif]

//Example : 
//[#if inviter_name][inviter_name] has invited you to join them on [app.name].[#else]You are invited to join [app.name][#endif]
// <p><% if (inviter_name) { %><%= inviter_name %> has invited you to join them on <%= app.name %>.<% } else { %>You are invited to join <%= app.name %><% } %></p>
