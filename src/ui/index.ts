/**
 * UI System Exports
 * Phase 37: UI/UX Polish
 *
 * Central export for all UI components and utilities
 */

// Layout
export {
  PageContainer,
  Section,
  Grid,
  FlexRow,
  Stack,
  Split,
  ChatbotSafeZone,
  spacing,
} from "./layout/AppGrid";

// Theme
export { colors, cssVariables } from "./theme/colors";
export {
  typography,
  textStyles,
  textClasses,
} from "./theme/typography";

// Components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/Card";

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableEmpty,
} from "./components/Table";

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "./components/Modal";

export {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
} from "./components/Drawer";

export {
  SectionHeader,
  SubsectionHeader,
} from "./components/SectionHeader";

export {
  ChartWrapper,
  StatCard,
} from "./components/ChartWrapper";
