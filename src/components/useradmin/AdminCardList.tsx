@@ .. @@
 interface AdminCardListProps {
   cards: BusinessCard[];
   onCreateCard: () => void;
-  onEditCard: (cardId: string) => void;
+  onEditCard: (cardId: string) => Promise<void>;
   loading: boolean;
 }