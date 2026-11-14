/* Fallback for platforms without home-screen widgets (web, tests). iOS and Android use the .ios/.android files. */
import type { QuoteWidgetProps } from '../core/widgetSync';

const QuoteWidget = {
  updateSnapshot(_props: QuoteWidgetProps) {},
  updateTimeline(_entries: { date: Date; props: QuoteWidgetProps }[]) {},
  async getTimeline(): Promise<{ date: Date; props: QuoteWidgetProps }[]> {
    return [];
  },
  reload() {},
};
export default QuoteWidget;
