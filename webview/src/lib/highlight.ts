export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-300 text-black">$1</mark>');
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function countMatches(element: HTMLElement, searchTerm: string): number {
  if (!searchTerm) return 0;
  
  const text = element.textContent || '';
  const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function scrollToMatch(element: HTMLElement, matchIndex: number): void {
  const marks = element.querySelectorAll('mark');
  
  if (marks.length > 0 && matchIndex >= 0 && matchIndex < marks.length) {
    marks[matchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 現在のマッチをハイライト
    marks.forEach((mark, index) => {
      if (index === matchIndex) {
        mark.classList.add('current-match');
        mark.classList.add('bg-orange-400');
        mark.classList.remove('bg-yellow-300');
      } else {
        mark.classList.remove('current-match');
        mark.classList.remove('bg-orange-400');
        mark.classList.add('bg-yellow-300');
      }
    });
  }
}