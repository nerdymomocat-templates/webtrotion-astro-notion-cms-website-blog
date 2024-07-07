/* eslint-disable prettier/prettier */
export interface QueryDatabase {
	database_id: string;
	filter?: PropertyFilterObject | CompoundFilterObject;
	sorts?: PropertyValueSortObject[];
	page_size?: number;
	start_cursor?: string;
}

export interface RetrieveDatabase {
	database_id: string;
}

export interface RetrieveBlock {
	block_id: string;
}

export interface RetrieveBlockChildren {
	block_id: string;
	page_size?: number;
	start_cursor?: string;
}

export interface PropertyFilterObject {
	property: string;

	checkbox?: CheckboxFilterCondition;
	select?: SelectFilterCondition;
	multi_select?: MultiSelectFilterCondition;
	relation?: RelationFilterCondition;
	rich_text?: RichTextFilterCondition;
	formula?: FormulaFilterCondition;

	date?: DateFilterCondition;
	created_time?: DateFilterCondition;
	last_edited_time?: DateFilterCondition;
}

export interface CompoundFilterObject {
	and?: PropertyFilterObject[] | CompoundFilterObject[];
	or?: PropertyFilterObject[] | CompoundFilterObject[];
}

export interface FormulaFilterCondition {
	checkbox?: CheckboxFilterCondition;
	date?: DateFilterCondition;
	string?: RichTextFilterCondition;
}

export interface RichTextFilterCondition {
	contains?: string;
	does_not_contain?: string;
	does_not_equal?: string;
	ends_with?: string;
	equals?: string;
	is_not_empty?: boolean;
	is_empty?: boolean;
	starts_with?: string;
}

export interface CheckboxFilterCondition {
	equals?: boolean;
	does_not_equal?: boolean;
}
export interface SelectFilterCondition {
	equals?: string;
	does_not_equal?: string;
	is_empty?: boolean;
	is_not_empty?: boolean;
}

export interface MultiSelectFilterCondition {
	contains?: string;
	does_not_contain?: string;
	is_empty?: boolean;
	is_not_empty?: boolean;
}

export interface RelationFilterCondition {
	contains?: string;
	does_not_contain?: string;
	is_empty?: boolean;
	is_not_empty?: boolean;
}

export interface DateFilterCondition {
	equals?: string;
	before?: string;
	after?: string;
	on_or_before?: string;
	is_empty?: boolean;
	is_not_empty?: boolean;
	on_or_after?: string;
}

export interface PropertyValueSortObject {
	property?: string;
	timestamp?: string;
	direction: string;
}
