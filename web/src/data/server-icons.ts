const icons: Record<string, string> = {
  postgres:'postgresql', sqlite:'sqlite', filesystem:'folder', github:'github', git:'git',
  'brave-search':'brave-browser', fetch:'globe', playwright:'playwright', memory:'brain',
  'sequential-thinking':'workflow', slack:'slack', docker:'docker', kubernetes:'kubernetes',
  stripe:'stripe', sentry:'sentry', supabase:'supabase', 'google-maps':'google-maps',
  time:'clock', everything:'blocks', notion:'notion', figma:'figma', mongodb:'mongodb',
  netlify:'netlify', redis:'redis',
};
export const serverIcon = (slug: string, catalogIcon?: string) => catalogIcon || `/icons/${icons[slug] || 'mcp'}.svg`;
