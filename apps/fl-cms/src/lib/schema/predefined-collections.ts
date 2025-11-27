import type { EntityCollection } from "../packages/firecms_core/types/collections";

export const templates: Record<string, EntityCollection> = {
    'blog': {
        id: 'blog',
        name: 'Blog',
        path: 'blog',
        description: 'A collection of blog entries',
        properties: {
            id: {
                editable: false,
                dataType: 'string',
                name: 'Id',
                readOnly: true,
                validation: {
                    required: true,
                },
            },
            image: {
                dataType: 'file',
                name: 'Image',
                storage: {
                    storeUrl: true,
                    acceptedFiles: [
                        'image/*',
                    ],
                    storagePath: 'images/blog',
                },
                preview: 'image',
            },
            title: {
                validation: {
                    required: true,
                },
                dataType: 'string',
                name: 'Title',
            },
            excerpt: {
                dataType: 'string',
                name: 'Excerpt',
                multiline: true,
            },
            content: {
                validation: {
                    required: true,
                },
                oneOf: {
                    valueField: 'value',
                    typeField: 'type',
                    properties: {
                        text: {
                            markdown: true,
                            dataType: 'string',
                            name: 'Text',
                        },
                        quote: {
                            name: 'Quote',
                            properties: {
                                cite: {
                                    dataType: 'string',
                                    name: 'cite',
                                },
                                text: {
                                    validation: {
                                        required: true,
                                    },
                                    multiline: true,
                                    dataType: 'string',
                                    name: 'text',
                                },
                            },
                            dataType: 'map',
                        },
                        iframe: {
                            name: 'IFrame',
                            dataType: 'map',
                            properties: {
                                src: {
                                    dataType: 'url',
                                    validation: {
                                        required: true,
                                    },
                                    url: true,
                                    name: 'src',
                                },
                                title: {
                                    name: 'title',
                                    dataType: 'string',
                                },
                            },
                        },
                        images: {
                            dataType: 'array',
                            of: {
                                dataType: 'file',
                                storage: {
                                    storagePath: 'images',
                                    acceptedFiles: [
                                        'image/*',
                                    ],
                                    metadata: {
                                        cacheControl: 'max-age=1000000',
                                    },
                                },
                                preview: 'image'
                            },
                            description: 'This fields allows uploading multiple images at once and reordering',
                            name: 'Images',
                        },
                    },
                },
                description: 'Content blocks for the blog entry',
                name: 'Content',
                dataType: 'set',
            },
            created_on: {
                dataType: 'date',
                name: 'Created on',
                autoValue: 'on_create',
            },
            status: {
                name: 'Status',
                dataType: 'string',
                defaultValue: 'draft',
                enumValues: {
                    published: {
                        label: 'Published',
                        id: 'published',
                    },
                    draft: 'Draft',
                },
                validation: {
                    required: true,
                },
            },
            publish_date: {
                dataType: 'date',
                clearable: true,
                name: 'Publish date',
            },
            sticky: {
                name: 'Sticky',
                dataType: 'boolean',
            },
            reviewed: {
                dataType: 'boolean',
                name: 'Reviewed',
            },
            tags: {
                dataType: 'array',
                of: {
                    dataType: 'string',
                    previewAsTag: true,
                },
                name: 'Tags',
                description: 'Example of generic array',
            },
        }
    },
    'list': { 
        id: 'list',
        name: 'List',
        path: 'list',
        description: 'Simple list of items',
        properties: {
            id: {
                editable: false,
                dataType: 'string',
                name: 'Id',
                readOnly: true,
                validation: {
                    required: true,
                },
            },
            order: {
                dataType: 'number',
                name: 'Order',
                validation: {
                    required: true,
                },
            },
            title: {
                dataType: 'string',
                name: 'Title',
                validation: {
                    required: true,
                },
            },
            description: {
                dataType: 'string',
                name: 'Description',
                markdown: true,
            },
        },
    },
    'page': {
        id: 'pages',
        name: 'Pages',
        path: 'pages',
        description: 'List of website pages that can be edited here',
        properties: {
            id: {
                editable: false,
                dataType: 'string',
                name: 'Id',
                readOnly: true,
                validation: {
                    required: true,
                },
            },
            title: {
                name: 'Page Title',
                validation: {
                    required: true,
                },
                dataType: 'string',
            },
            content: {
                oneOf: {
                    properties: {
                        text: {
                            markdown: true,
                            dataType: 'string',
                            name: 'Text',
                        },
                        expand: {
                            name: 'Expandable',
                            dataType: 'map',
                            properties: {
                                description: {
                                    description: 'Summary of the content',
                                    dataType: 'string',
                                    name: 'Description',
                                },
                                title: {
                                    defaultValue: 'Show more',
                                    dataType: 'string',
                                    name: 'Title',
                                },
                                content: {
                                    dataType: 'string',
                                    name: 'Content',
                                    markdown: true,
                                },
                            },
                        },
                        iframe: {
                            properties: {
                                title: {
                                    name: 'Title',
                                    dataType: 'string',
                                },
                                src: {
                                    url: true,
                                    name: 'Source',
                                    validation: {
                                        required: true,
                                    },
                                    dataType: 'url',
                                },
                                type: {
                                    enumValues: [
                                        {
                                            label: 'custom',
                                            id: 'custom',
                                        },
                                        {
                                            label: 'youtube',
                                            id: 'youtube',
                                        },
                                    ],
                                    name: 'Type',
                                    dataType: 'string',
                                    defaultValue: 'custom',
                                },
                            },
                            name: 'IFrame',
                            dataType: 'map',
                        },
                        quote: {
                            name: 'Quote',
                            properties: {
                                cite: {
                                    dataType: 'string',
                                    name: 'cite',
                                },
                                text: {
                                    validation: {
                                        required: true,
                                    },
                                    multiline: true,
                                    dataType: 'string',
                                    name: 'text',
                                },
                            },
                            dataType: 'map',
                        },
                        section: {
                            name: 'Section',
                            properties: {
                                image: {
                                    storage: {
                                        acceptedFiles: [
                                            'image/*',
                                        ],
                                        storagePath: 'page_sections/images',
                                    },
                                    name: 'Section Image',
                                    dataType: 'file',
                                    preview: 'image',
                                },
                                title: {
                                    validation: {
                                        required: true,
                                    },
                                    name: 'Section Title',
                                    dataType: 'string',
                                },
                                content: {
                                    markdown: true,
                                    name: 'Section Content',
                                    dataType: 'string',
                                },
                                link: {
                                    dataType: 'url',
                                    name: 'Section Link',
                                    url: true,
                                },
                            },
                            dataType: 'map',
                        },
                        slider: {
                            name: 'Slider',
                            of: {
                                dataType: 'map',
                                properties: {
                                    file: {
                                        dataType: 'file',
                                        storage: {
                                            storagePath: 'page/images/slider',
                                            storeUrl: true,
                                            acceptedFiles: [
                                                'image/*',
                                            ],
                                        },
                                        preview: 'image',
                                        name: 'File',
                                    },
                                    url: {
                                        url: 'image',
                                        dataType: 'url',
                                        name: 'url',
                                    },
                                    title: {
                                        validation: {
                                            required: true,
                                        },
                                        dataType: 'string',
                                        name: 'Title',
                                    },
                                },
                            },
                            dataType: 'array',
                        },
                        file: {
                            dataType: 'file',
                            storage: {
                                acceptedFiles: [
                                    'image/*',
                                ],
                                storagePath: 'page/sections/images',
                            },
                            name: 'File',
                        }
                    },
                },
                name: 'Content',
                dataType: 'set',
            },
            min_read_time: {
                name: 'Min Read Time',
                description: 'Minimal read time in minutes to complete page',
                validation: {
                    required: true,
                },
                defaultValue: 5,
                dataType: 'number',
            },
            hero_section: {
                name: 'Header',
                dataType: 'map',
                properties: {
                    headline: {
                        name: 'Headline',
                        dataType: 'string',
                        validation: {
                            required: true,
                        },
                    },
                    subhead: {
                        dataType: 'string',
                        name: 'Subheadline',
                    },
                    image: {
                        dataType: 'file',
                        preview: 'image',
                        name: 'Image',
                        storage: {
                            storeUrl: true,
                            acceptedFiles: [
                                'image/*',
                            ],
                            storagePath: 'page/images/hero',
                        },
                    },
                    image_info: {
                        dataType: 'string',
                        name: 'Image Info',
                    },
                    call_to_action: {
                        dataType: 'string',
                        name: 'Call to Action',
                    },
                    call_to_action_link: {
                        dataType: 'url',
                        name: 'CTA Link',
                        url: true,
                    },
                },
            },
            footer_override: {
            	name: 'Footer Override',
            	dataType: 'string',
            	markdown: true,
            },
            publish_date: {
                dataType: 'date',
                validation: {
                    required: true,
                },
                autoValue: 'on_create',
                name: 'Publish Date',
            },
            last_updated: {
                autoValue: 'on_update',
                dataType: 'date',
                name: 'Last Updated',
            },
            status: {
                enumValues: [
                    {
                        id: 'published',
                        label: 'published',
                    },
                    {
                        label: 'draft',
                        id: 'draft',
                    },
                ],
                dataType: 'string',
                defaultValue: 'draft',
                name: 'Status',
            },
        },
    }
}