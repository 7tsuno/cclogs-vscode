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
    // Chrome風に即座にスクロール（アニメーションなし）
    marks[matchIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
    
    // 現在のマッチをハイライト（Chrome風のオレンジ色）
    marks.forEach((mark, index) => {
      const markEl = mark as HTMLElement;
      if (index === matchIndex) {
        markEl.style.backgroundColor = 'rgb(255, 150, 50)';
        markEl.style.color = 'black';
      } else {
        markEl.style.backgroundColor = 'rgb(255, 212, 0)';
        markEl.style.color = 'black';
      }
    });
  }
}